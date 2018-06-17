import { forEachChild, Node, SyntaxKind } from 'typescript'

export function traverseNode<A>(f: (acc: A, node: Node) => A, seed: A, sourceFile: Node): A {
  let acc = seed

  visitChildren(sourceFile)

  return acc

  function visitChildren(node: Node) {
    if (node.kind !== SyntaxKind.SourceFile) {
      acc = f(acc, node)
    }

    forEachChild(node, visitChildren)
  }
}
