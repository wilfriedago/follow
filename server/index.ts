import "./lib/load-env"

import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import middie from "@fastify/middie"
import { config } from "dotenv"
import Fastify from "fastify"

import { globalRoute } from "./router/global"
import { ogRoute } from "./router/og"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({
  path: resolve(__dirname, "../.env"),
})

const app = Fastify({})

declare global {
  export type App = typeof app
}

await app.register(middie, {
  hook: "onRequest",
})

const require = createRequire(import.meta.url)

if (process.env.NODE_ENV === "development") {
  const devVite = require("./lib/dev-vite")
  await devVite.registerDevViteServer(app)
}

ogRoute(app)
globalRoute(app)

const isVercel = process.env.VERCEL === "1"
if (!isVercel) {
  await app.listen({ port: 2233 })
  console.info("Server is running on http://localhost:2233")
}

export default async function handler(req: any, res: any) {
  await app.ready()
  app.server.emit("request", req, res)
}
