import fs from "node:fs"
import path, { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import middie from "@fastify/middie"
import type { FastifyRequest } from "fastify"
import Fastify from "fastify"
import { createServer as createViteServer } from "vite"

import { createApiClient } from "./api-client"

const app = Fastify({})
await app.register(middie, {
  hook: "onRequest",
})

function buildSeoMetaTags(configs: {
  openGraph: {
    title: string
    description?: string
    image?: string | null
  }
}) {
  const { openGraph } = configs
  return [
    `<meta property="og:title" content="${openGraph.title}" />`,
    openGraph.description
      ? `<meta property="og:description" content="${openGraph.description}" />`
      : "",
    openGraph.image ? `<meta property="og:image" content="${openGraph.image}" />` : "",
    // Twitter
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:title" content="${openGraph.title}" />`,
    openGraph.description
      ? `<meta property="twitter:description" content="${openGraph.description}" />`
      : "",
    openGraph.image ? `<meta property="twitter:image" content="${openGraph.image}" />` : "",
  ]
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",

  configFile: resolve(root, "vite.config.ts"),
})

app.use(vite.middlewares)

app.get("*", async (req, reply) => {
  const url = req.originalUrl

  try {
    let template = fs.readFileSync(path.resolve(root, vite.config.root, "index.html"), "utf-8")

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
      template = template.slice(0, startIndex) + template.slice(endIndex + endCommentString.length)
    }

    reply.type("text/html")
    reply.send(template)
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
    case url.startsWith("/feed"): {
      const parsedUrl = new URL(url, "https://example.com")
      const feedId = parsedUrl.pathname.split("/")[2]
      const feed = await apiClient.feeds
        .$get({
          query: {
            id: feedId,
          },
        })
        .then((res) => res.data.feed)

      if (!feed) {
        return ""
      }

      if (!feed.title || !feed.description) {
        return ""
      }

      metaArr.push(
        ...buildSeoMetaTags({
          openGraph: {
            title: feed.title,
            description: feed.description,
            image: feed.image,
          },
        }),
      )
      break
    }
  }

  return metaArr.join("\n")
}

const isVercel = process.env.VERCEL === "1"
if (!isVercel) {
  await app.listen({ port: 2233 })
  console.info("Server is running on http://localhost:2233")
}

export default async function handler(req: any, res: any) {
  await app.ready()
  app.server.emit("request", req, res)
}
