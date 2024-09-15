import { execSync } from "node:child_process"
import fs, { readFile, readFileSync } from "node:fs"
import path, { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import middie from "@fastify/middie"
import FastifyVite from "@fastify/vite"
import { createHtmlTemplateFunction } from "@fastify/vite/utils"
import type { FastifyReply, FastifyRequest } from "fastify"
import Fastify from "fastify"
import { createServer as createViteServer } from "vite"

const isDev = process.argv.includes("--dev")

// const __dirname = dirname(fileURLToPath(import.meta.url))
// async function ca() {
//   // Create CA and cert if in dev mode
//   if (!isDev) {
//     return
//   }
//   const caExists =
//     fs.existsSync(resolve(__dirname, "./cert/fastify.key")) &&
//     fs.existsSync(resolve(__dirname, "./cert/fastify.cert"))
//   if (caExists) {
//     return
//   }

//   const ca = await createCA({
//     organization: "Dev CA",
//     countryCode: "US",
//     state: "California",
//     locality: "San Francisco",
//     validity: 365,
//   })

//   const cert = await createCert({
//     domains: ["localhost", "127.0.0.1"],
//     validity: 365,
//     ca: {
//       key: ca.key,
//       cert: ca.cert,
//     },
//   })

//   fs.writeFileSync(resolve(__dirname, "./cert/fastify.key"), cert.key)
//   fs.writeFileSync(resolve(__dirname, "./cert/fastify.cert"), cert.cert)
// }

// await ca()
// // write a macos system extension to trust the cert if not trusted
// if (isDev && process.platform === "darwin") {
//   execSync(
//     `security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain ${resolve(__dirname, "./cert/fastify.cert")}`,
//   )
// }

const server = Fastify({})
await server.register(middie, {
  hook: "onRequest", // default
})

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",

  configFile: resolve(root, "vite.config.ts"),
})

server.use(vite.middlewares)

server.get("*", async (req, reply) => {
  const url = req.originalUrl

  try {
    let template = fs.readFileSync(path.resolve(root, vite.config.root, "index.html"), "utf-8")

    template = await vite.transformIndexHtml(url, template)

    const html = template.replace(`<!-- SSG-META -->`, injectMetaHandler(url, req))

    reply.type("text/html")
    reply.send(html)
  } catch (e) {
    vite.ssrFixStacktrace(e)
    reply.code(500).send(e)
  }
})

function injectMetaHandler(url: string, req: FastifyRequest) {
  const metaArr = [] as string[]

  // og:title
  metaArr.push(
    `<meta property="og:title" content="Follow" />`,
    `<meta property="og:url" content="https://app.follow.is" />`,
    `<meta property="og:image" content="https://app.follow.is/opengraph-image.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="Follow" />`,
    `<meta name="twitter:image" content="https://app.follow.is/opengraph-image.png" />`,
  )
  return metaArr.join("\n")
}

await server.listen({ port: 2233 })

console.info("Server is running on http://localhost:2233")
