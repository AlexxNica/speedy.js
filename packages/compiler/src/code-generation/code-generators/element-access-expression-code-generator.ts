import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {ObjectIndexReference} from "../value/object-index-reference";

/**
 * Element Access Code Generator, eg. array[index]
 */
class ElementAccessExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ElementAccessExpression, ObjectIndexReference> {
    syntaxKind = ts.SyntaxKind.ElementAccessExpression;

    generate(node: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference {
        if (!node.argumentExpression) {
            throw CodeGenerationDiagnostic.unsupportedElementAccessExpression(node);
        }

        const argumentExpressionType = context.typeChecker.getTypeAtLocation(node.argumentExpression);
        if (!(argumentExpressionType.flags & ts.TypeFlags.IntLike)) {
            throw CodeGenerationDiagnostic.unsupportedElementAccessExpression(node, context.typeChecker.typeToString(argumentExpressionType));
        }

        const value = context.generateValue(node.expression).dereference(context);

        if (value.isObject()) {
            return value.getIndexer(node, context);
        }

        throw CodeGenerationDiagnostic.unsupportedIndexer(node);
    }
}

export default ElementAccessExpressionCodeGenerator;
