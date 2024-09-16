import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path, { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// import { getViteServer } from "../lib/dev-vite"
import { injectMetaHandler } from "../lib/meta-handler"

const require = createRequire(import.meta.url)

const devHandler = (app: App) => {
  app.get("*", async (req, reply) => {
    const url = req.originalUrl

    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")

    const vite = require("../lib/dev-vite").getViteServer()
    try {
      let template = readFileSync(path.resolve(root, vite.config.root, "index.html"), "utf-8")

      template = await vite.transformIndexHtml(url, template)

      const dynamicInjectMetaString = await injectMetaHandler(url, req).catch((err) => {
        if (process.env.NODE_ENV === "development") {
          throw err
        }
        return ""
      })
      template = template.replace(`<!-- SSG-META -->`, dynamicInjectMetaString)

      if (dynamicInjectMetaString) {
        template = template.replace(`<!-- SSG-META -->`, dynamicInjectMetaString)

        // Remove <!-- Default Open Graph --> between <!-- End Default Open Graph -->
        const endCommentString = "<!-- End Default Open Graph -->"
        const startIndex = template.indexOf("<!-- Default Open Graph -->")
        const endIndex = template.indexOf(endCommentString)
        template =
          template.slice(0, startIndex) + template.slice(endIndex + endCommentString.length)
      }

      reply.type("text/html")
      reply.send(template)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      reply.code(500).send(e)
    }
  })
}
const handler = (app: App) => {
  app.get("*", async (req, reply) => {
    // let template = readFileSync(path.resolve(root, vite.config.root, "index.html"), "utf-8")
  })
}

export const globalRoute = process.env.NODE_ENV === "development" ? devHandler : handler
