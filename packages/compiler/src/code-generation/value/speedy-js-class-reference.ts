import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/types";

import {ClassReference} from "./class-reference";
import {FunctionReference} from "./function-reference";
import {ObjectReference} from "./object-reference";
import {SpeedyJSConstructorFunctionReference} from "./speedyjs-constructor-function-reference";
import {SpeedyJSObjectReference} from "./speedyjs-object-reference";

export class SpeedyJSClassReference extends ClassReference {

    static create(type: ts.ObjectType, context: CodeGenerationContext) {
        const typeInformation = ClassReference.createTypeDescriptor(type.getSymbol(), context);
        return new SpeedyJSClassReference(typeInformation, type, context.compilationContext);
    }

    constructor(typeInformation: llvm.GlobalVariable, private _type: ts.ObjectType, compilationContext: CompilationContext) {
        super(typeInformation, _type.getSymbol(), compilationContext);
    }

    public get type() {
        return this._type;
    }

    protected getFields(type: ts.ObjectType, context: CodeGenerationContext): llvm.Type[] {
        const fields = this.type.getApparentProperties().filter(property => property.flags & ts.SymbolFlags.Property);

        return fields.map(field => {
            const type = context.typeChecker.getTypeOfSymbolAtLocation(field, field.valueDeclaration!);
            return toLLVMType(type, context);
        });
    }

    getConstructor(newExpression: ts.NewExpression, context: CodeGenerationContext): FunctionReference {
        const signature = context.typeChecker.getResolvedSignature(newExpression);
        context.requiresGc = true;
        return SpeedyJSConstructorFunctionReference.create(signature, this, context);
    }

    objectFor(pointer: llvm.Value, type: ts.ObjectType, context: CodeGenerationContext): ObjectReference {
        return new SpeedyJSObjectReference(pointer, type, this);
    }
}