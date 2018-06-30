import {
  Identifier,
  isCallLikeExpression,
  isExportAssignment,
  isExportSpecifier,
  isIdentifier,
  isVariableDeclaration,
  isVariableDeclarationList,
  isVariableStatement,
  Node,
  SourceFile,
  Symbol,
  SyntaxKind,
  Type,
  TypeChecker,
  VariableDeclaration,
  VariableDeclarationList,
  VariableStatement,
} from 'typescript'
import { flatten } from '../common/flatten'
import { NodeMetadata, TestMetadata } from '../types'
import { getNodes, hasExports } from '../typescript/dependencies'
import { traverseNode } from '../typescript/traverseNode'

type NodeAndSource<A extends Node = Node> = { node: A; sourceFile: SourceFile }
type LocalAndExportedIdentifier = { exported: string; local: string; sourceFile: SourceFile }

export function parseTestMetadata(
  sourceFiles: ReadonlyArray<SourceFile>,
  // tslint:disable-next-line:ban-types
  typedTestSymbol: Symbol,
  typeChecker: TypeChecker,
): TestMetadata[] {
  const testNodes = findAllTestNodes(sourceFiles, typedTestSymbol, typeChecker)
  const exportedTestIdentifiers = findExportedTestIndentifiers(testNodes)
  const exportedTestNames = exportedTestIdentifiers.map(x => x.exported)
  const testDeclarationNodes = testNodes.filter(isVariableDeclarationNodeSource(exportedTestNames))

  return testDeclarationNodes.map(
    findTestMetadataFromNodeSource(exportedTestIdentifiers, testNodes),
  )
}

function isVariableDeclarationNodeSource(exportNames: string[]) {
  return (x: NodeAndSource): x is NodeAndSource<VariableDeclaration> =>
    isVariableDeclaration(x.node) && exportNames.includes(findIdentifingName(x.node))
}

function findTestMetadataFromNodeSource(
  testIdentifiers: LocalAndExportedIdentifier[],
  testNodes: NodeAndSource[],
) {
  return ({ node, sourceFile }: NodeAndSource<VariableDeclaration>): TestMetadata => {
    const statement = ((node as VariableDeclaration).parent as VariableDeclarationList)
      .parent as VariableStatement
    const declarationName = findVariableDeclarationName(node)
    const exportNames = testIdentifiers
      .filter(x => x.sourceFile.fileName === sourceFile.fileName && x.local === declarationName)
      .map(x => x.exported)
    const subTests = testNodes.filter(
      x =>
        x.sourceFile === sourceFile &&
        x.node !== node &&
        x.node.getStart() > node.getStart() &&
        x.node.getEnd() < node.getEnd(),
    )

    return {
      ...findNodeMetadata({ node: statement, sourceFile }),
      exportNames,
      filePath: sourceFile.fileName,
      additionalTests: subTests
        .map(findNodeMetadata)
        .sort(({ position: [a] }, { position: [b] }) => (a === b ? 0 : a < b ? -1 : 1)),
    }
  }
}

function findNodeMetadata({ node, sourceFile }: NodeAndSource): NodeMetadata {
  const subPosition = [node.getStart(), node.getEnd()] as [number, number]
  const subLine = sourceFile.text.slice(0, subPosition[0]).split(/\n/g).length
  const subText = node.getText()
  const subLines = subText.split(/\n/g).length

  return {
    line: subLine,
    lines: subLines,
    position: subPosition,
    text: subText,
  }
}

function findAllTestNodes(
  sourceFiles: ReadonlyArray<SourceFile>,
  symbol: Symbol,
  typeChecker: TypeChecker,
): NodeAndSource[] {
  return flatten(
    sourceFiles.map(sourceFile => {
      if (sourceFile.isDeclarationFile || !hasExports(sourceFile)) {
        return []
      }

      return traverseNode(findTestNodes(symbol, typeChecker), [], sourceFile).map(node => ({
        node,
        sourceFile,
      }))
    }),
  )
}

function findExportedTestIndentifiers(nodes: NodeAndSource[]): LocalAndExportedIdentifier[] {
  return nodes
    .filter(x => isExportedVariableDeclaration(x.node) || isExportedIdentifier(x.node))
    .map(
      x =>
        isVariableDeclaration(x.node)
          ? {
              exported: findVariableDeclarationName(x.node),
              local: findVariableDeclarationName(x.node),
              sourceFile: x.sourceFile,
            }
          : { ...findIdentifierName(x.node as Identifier), sourceFile: x.sourceFile },
    )
}

function isExportedVariableDeclaration(x: Node): x is VariableDeclaration {
  return (
    (isVariableDeclaration(x) &&
      x.parent &&
      isVariableDeclarationList(x.parent) &&
      x.parent.parent &&
      isVariableStatement(x.parent.parent) &&
      x.parent.parent.modifiers &&
      x.parent.parent.modifiers.some(m => m.kind === SyntaxKind.ExportKeyword)) ||
    false
  )
}

function isExportedIdentifier(x: Node): x is Identifier {
  if (isIdentifier(x) && x.parent) {
    if (isExportAssignment(x.parent) || isExportSpecifier(x.parent)) {
      return true
    }
  }

  return false
}

function findTestNodes(testSymbol: Symbol, typeChecker: TypeChecker) {
  return (testNodes: Node[], node: Node): Node[] => {
    const types = tryGetTypes(node, typeChecker)

    if (!types) {
      return testNodes
    }

    return types.map(tryGetSymbol).some(x => x === testSymbol) ? testNodes.concat(node) : testNodes
  }
}

function findIdentifingName(x: VariableDeclaration | Identifier): string {
  return isVariableDeclaration(x) ? findVariableDeclarationName(x) : findIdentifierName(x).exported
}

function findIdentifierName(x: Identifier) {
  if (x.parent && isExportAssignment(x.parent) && x.parent.getText().includes('export default ')) {
    return { exported: 'default', local: x.text }
  }

  return { exported: x.text, local: x.text }
}

function findVariableDeclarationName(x: VariableDeclaration): string {
  const nodes = getNodes(x)

  for (const node of nodes) {
    if (isIdentifier(node)) {
      return node.text
    }
  }

  if (isIdentifier(x.name)) {
    return x.name.text
  }

  throw new Error('Unabled to find test name')
}

function tryGetTypes(node: Node, typeChecker: TypeChecker): Type[] | undefined {
  try {
    const type = typeChecker.getWidenedType(typeChecker.getTypeAtLocation(node))
    const types = [type]
    const baseTypes = type.getBaseTypes()

    if (baseTypes) {
      types.push(...baseTypes)
    }

    if (isCallLikeExpression(node)) {
      const returnType = typeChecker.getReturnTypeOfSignature(
        typeChecker.getResolvedSignature(node),
      )

      types.push(returnType)
    }

    return types
  } catch {
    return undefined
  }
}

function tryGetSymbol(type: Type | undefined): Symbol | undefined {
  if (!type) {
    return
  }

  try {
    return type.getSymbol()
  } catch {
    return undefined
  }
}
