import { config } from "dotenv"

config({
  path: process.env.NODE_ENV
    ? `.env.${process.env.NODE_ENV}`
    : ".env.production",
})

// ---------------- Apple Store Config

// The bundle ID of the app, used for App Store Connect API requests (iOS/macOS apps)
const APP_STORE_BUNDLE_ID = process.env.APP_STORE_BUNDLE_ID || ""

// The key ID for the Apple App Store Server API, used for JWT authentication
const APP_STORE_ISSUER_ID = process.env.APP_STORE_ISSUER_ID || ""

// The Apple ID of the app, used for App Store Connect API requests (iOS/macOS apps)
const APP_APPLE_ID = process.env.APP_APPLE_ID || ""

//  - App Store Kit API Key
const APP_STORE_KIT_KEY = process.env.APP_STORE_KIT_KEY || ""
// The key ID for the App Store StoreKit v2 API, used for JWT authentication
const APP_STORE_KIT_KEY_ID = process.env.APP_STORE_KIT_KEY_ID || ""

// - App Store Connect API Key
const APP_STORE_CONNECT_KEY = process.env.APP_STORE_CONNECT_KEY || ""
// The key ID for the App Store Connect API, used for JWT authentication
const APP_STORE_CONNECT_KEY_ID = process.env.APP_STORE_CONNECT_KEY_ID || ""

export {
  APP_APPLE_ID,
  APP_STORE_BUNDLE_ID,
  APP_STORE_ISSUER_ID,
  APP_STORE_CONNECT_KEY,
  APP_STORE_CONNECT_KEY_ID,
  APP_STORE_KIT_KEY,
  APP_STORE_KIT_KEY_ID,
}
