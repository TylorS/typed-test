import { forEachChild, Node } from 'typescript'

export function findNode(
  predicate: (node: Node) => boolean,
  sourceNodes: ReadonlyArray<Node>,
): Promise<Node> {
  return new Promise((resolve, reject) => {
    for (const node of sourceNodes) {
      visitChildren(node)
    }

    function visitChildren(node: Node) {
      if (predicate(node)) {
        return resolve(node)
      }

      forEachChild(node, visitChildren)
    }

    reject(new Error('Unable to find Node'))
  })
}
