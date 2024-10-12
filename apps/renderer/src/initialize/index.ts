import { browserDB } from "~/database"

import { subscribeShouldUseIndexedDB } from "../atoms/settings/general"
import { setHydrated } from "./hydrate"

const cleanup = subscribeShouldUseIndexedDB((value) => {
  if (!value) {
    browserDB.tables.forEach((table) => {
      table.clear()
    })
    setHydrated(false)
    return
  }
  setHydrated(true)
})

declare global {
  interface Window {
    version: string
  }
}

export const initializeApp = async () => {
  // appLog(`${APP_NAME}: Next generation information browser`, repository.url)
  // appLog(`Initialize ${APP_NAME}...`)
  // window.version = APP_VERSION
  // const now = Date.now()
  // // Initialize the auth config first
  // authConfigManager.setConfig({
  //   baseUrl: env.VITE_API_URL,
  //   basePath: "/auth",
  //   credentials: "include",
  // })
  // // Set Environment
  // document.documentElement.dataset.buildType = isElectronBuild ? "electron" : "web"
  // // Register global context for electron
  // registerGlobalContext({
  //   /**
  //    * Electron app only
  //    */
  //   onWindowClose() {
  //     document.dispatchEvent(new ElectronCloseEvent())
  //   },
  //   onWindowShow() {
  //     document.dispatchEvent(new ElectronShowEvent())
  //   },
  // })
  // apm("migration", doMigration)
  // // Initialize dayjs
  // dayjs.extend(duration)
  // dayjs.extend(relativeTime)
  // dayjs.extend(localizedFormat)
  // // Enable Map/Set in immer
  // enableMapSet()
  // subscribeNetworkStatus()
  // apm("hydrateSettings", hydrateSettings)
  // apm("setting sync", () => {
  //   settingSyncQueue.init()
  //   settingSyncQueue.syncLocal()
  // })
  // // should after hydrateSettings
  // const { dataPersist: enabledDataPersist } = getGeneralSettings()
  // initSentry()
  // initPostHog()
  // await apm("i18n", initI18n)
  // let dataHydratedTime: undefined | number
  // // Initialize the database
  // if (enabledDataPersist) {
  //   dataHydratedTime = await apm("hydrateDatabaseToStore", hydrateDatabaseToStore)
  //   CleanerService.cleanOutdatedData()
  // }
  // const loadingTime = Date.now() - now
  // appLog(`Initialize ${APP_NAME} done,`, `${loadingTime}ms`)
  // window.posthog?.capture("app_init", {
  //   electron: IN_ELECTRON,
  //   loading_time: loadingTime,
  //   using_indexed_db: enabledDataPersist,
  //   data_hydrated_time: dataHydratedTime,
  //   version: APP_VERSION,
  // })
}

import.meta.hot?.dispose(cleanup)

// const apm = async (label: string, fn: () => Promise<any> | any) => {
//   const start = Date.now()
//   const result = await fn()
//   const end = Date.now()
//   appLog(`${label} took ${end - start}ms`)
//   return result
// }
