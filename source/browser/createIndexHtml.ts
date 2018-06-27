export function createIndexHtml(testFile: string): string {
  return `<html>
  <head>
    <title>Typed Test</title>
    <style>
      p {
        margin: 0 0.25rem;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="./${testFile}"></script>
  </body>
</html>`
}
