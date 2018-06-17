import { InterfaceDeclaration, Node, SyntaxKind, TypeChecker } from 'typescript'

const TYPED_TEST_REGEX = /__@TYPED_TEST@[0-9]+/

export function isTypedTestTestInterface(typeChecker: TypeChecker) {
  return (node: Node): node is InterfaceDeclaration => {
    if (node.kind === SyntaxKind.InterfaceDeclaration) {
      const type = typeChecker.getTypeAtLocation(node)
      const symbol = type.getSymbol()

      if (symbol && symbol.getName() === 'Test') {
        const properties = typeChecker.getPropertiesOfType(type)
        const escapedNames = properties.map(x => x.getEscapedName()).sort() as string[]

        return (
          escapedNames.length === 2 &&
          TYPED_TEST_REGEX.test(escapedNames[0]) &&
          escapedNames[1] === 'runTest' &&
          symbol === typeChecker.getExportSymbolOfSymbol(symbol)
        )
      }
    }

    return false
  }
}
