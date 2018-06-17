import { Node, SourceFile, SyntaxKind } from 'typescript'

const MODULE_REGEX = /import |export |module.exports|exports/
const REQUIRE_REGEX = /require\(([a-zA-Z0-9])+\)/
const EXPORT_REGEX = /export |module.exports|exports/

const hasNodeGlobalImpact = (node: Node): boolean =>
  node.kind === SyntaxKind.DeclareKeyword ? true : getNodes(node).some(hasNodeGlobalImpact)

const hasModules = ({ text }: SourceFile): boolean =>
  MODULE_REGEX.test(text) || REQUIRE_REGEX.test(text)

export const hasExports = ({ text }: SourceFile): boolean => EXPORT_REGEX.test(text)

export const getNodes = (item: {
  forEachChild: (cbNode: (node: Node) => void) => void
}): Node[] => {
  const nodes: Node[] = []

  item.forEachChild((node: Node) => {
    nodes.push(node)
  })

  return nodes
}

export const hasGlobalImpact = (sourceFile: SourceFile): boolean =>
  getNodes(sourceFile).some(hasNodeGlobalImpact) || !hasModules(sourceFile)

export const getDependencies = (sourceFile: SourceFile) => {
  const resolvedModules = (sourceFile as any).resolvedModules

  if (resolvedModules) {
    return Array.from(resolvedModules.values())
      .filter((resolved: any) => Boolean(resolved))
      .map((resolved: any) => resolved.resolvedFileName)
  }

  return []
}
