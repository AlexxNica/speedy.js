import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {isMaybeObjectType, toLLVMType} from "../util/types";
import {Address} from "./address";
import {AddressLValue} from "./address-lvalue";
import {FunctionReference} from "./function-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectReference} from "./object-reference";
import {SpeedyJSClassReference} from "./speedy-js-class-reference";
import {UnresolvedMethodReference} from "./unresolved-method-reference";
import {Value} from "./value";

export class SpeedyJSObjectReference implements ObjectReference {

    constructor(private address: Address, public type: ts.ObjectType, public clazz: SpeedyJSClassReference) {
    }

    getTypeStoreSize(context: CodeGenerationContext) {
        return this.clazz.getTypeStoreSize(this.type, context);
    }

    getProperty(property: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference | FunctionReference {
        const symbol = context.typeChecker.getSymbolAtLocation(property);

        if (symbol.flags & ts.SymbolFlags.Property) {
            const type = context.typeChecker.getTypeAtLocation(property);
            return ObjectPropertyReference.createFieldProperty(type, this, symbol);
        }

        // otherwise it is a method
        const type = context.typeChecker.getTypeAtLocation(property);
        const apparentType = context.typeChecker.getApparentType(type);
        const signatures = context.typeChecker.getSignaturesOfType(apparentType, ts.SignatureKind.Call);

        return UnresolvedMethodReference.createMethod(this, signatures, context);
    }

    getIndexer(element: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference {
        throw CodeGenerationDiagnostic.unsupportedIndexer(element);
    }

    isAssignable(): false {
        return false;
    }

    isObject(): this is ObjectReference {
        return true;
    }

    castImplicit(type: ts.Type, context: CodeGenerationContext): Value | undefined {
        if (this.type === type || isMaybeObjectType(type) && type.types.indexOf(this.type) !== -1) {
            return this;
        }

        // casting it to undefined. Casts to other types are not yet supported
        if (type.flags & ts.TypeFlags.Undefined) {
            const castedPtr = context.builder.createBitCast(this.generateIR(context), toLLVMType(type, context));
            return this.clazz.objectFor(new AddressLValue(castedPtr, type), this.type, context);
        }

        if (type.flags & ts.TypeFlags.TypeParameter) {
            const typeParameter = type as ts.TypeParameter;

            // e.g. function with return type this
            if (typeParameter.constraint === this.type) {
                return this;
            }
        }

        return undefined;
    }

    dereference(context: CodeGenerationContext): Value {
        return this;
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.address.get(context);
    }
}
