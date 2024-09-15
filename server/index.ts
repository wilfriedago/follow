import fs from "node:fs"
import path, { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import middie from "@fastify/middie"
import type { FastifyRequest } from "fastify"
import Fastify from "fastify"
import { createServer as createViteServer } from "vite"

import { createApiClient } from "./api-client"

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

    const html = template.replace(`<!-- SSG-META -->`, await injectMetaHandler(url, req))

    reply.type("text/html")
    reply.send(html)
  } catch (e) {
    vite.ssrFixStacktrace(e)
    reply.code(500).send(e)
  }
})

async function injectMetaHandler(url: string, req: FastifyRequest) {
  const metaArr = [] as string[]

  const { cookie = "" } = req.headers

  const parsedCookieMap = cookie
    .split(";")
    .map((item) => item.trim())
    .reduce(
      (acc, item) => {
        const [key, value] = item.split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

  const token = parsedCookieMap["authjs.session-token"]

  if (!token) {
    return ""
  }

  const apiClient = createApiClient(token)

  switch (true) {
    case url.startsWith("/feeds"): {
      const sub = await apiClient.subscriptions
        .$get({
          query: {},
        })
        .then((sub) => sub.data)
        .catch((e) => {
          console.error(e)
          return null
        })

      if (!sub) {
        return ""
      }
      // const feeds = await apiClient.feeds.list()
      // metaArr.push(`<meta property="og:title" content="${feeds.title}" />`)
      // metaArr.push(`<meta property="og:description" content="${feeds.description}" />`)
      // metaArr.push(`<meta property="og:image" content="${feeds.image}" />`)
      metaArr.push(`<meta property="og:title" content="Feeds" />`)
      break
    }
  }

  return metaArr.join("\n")
}

await server.listen({ port: 2233 })

console.info("Server is running on http://localhost:2233")
