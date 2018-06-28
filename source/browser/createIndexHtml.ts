import { ROOT_ELEMENT_ID } from './constants'

export function createIndexHtml(testFile: string): string {
  return `<html>
  <head>
    <title>Typed Test</title>
  </head>
  <body>
    <div id="${ROOT_ELEMENT_ID}"></div>
    <script src="./${testFile}"></script>
  </body>
</html>`
}
