export function createIndexHtml(testFile: string): string {
  return `<html>
  <head>
    <title>Typed Test</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="./${testFile}"></script>
  </body>
</html>`
}
