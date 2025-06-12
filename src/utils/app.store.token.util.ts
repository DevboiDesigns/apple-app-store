import { sign, SignOptions } from "jsonwebtoken"
import {
  APP_STORE_BUNDLE_ID,
  APP_STORE_ISSUER_ID,
  APP_STORE_CONNECT_KEY,
  APP_STORE_CONNECT_KEY_ID,
  APP_STORE_KIT_KEY,
  APP_STORE_KIT_KEY_ID,
} from "../config/env.keys"
import fs from "fs"

/**
 * Utility class for generating Apple StoreKit JWT tokens
 * @class AppleStoreKitToken
 * @description
 * This class provides methods to generate JWT tokens for Apple App Store Server API authentication.
 * The tokens are signed with a private key and include the issuer ID, key ID, and other claims.
 * The tokens are valid for 20 minutes and are used to authenticate requests to the Apple App Store Server API.
 * The private key is read from a file specified in the environment variable APPLE_API_KEY_PATH.
 * The token generation uses the ES256 algorithm.
 * @example
 * const token = AppleStoreKitToken.token("connect");
 * console.log(token); // Outputs the generated JWT token
 * @throws {Error} - If the token generation fails or if the private key is not set
 * @typedef {("connect" | "store-kit")} TokenType
 * @property {string} connect - Token type for App Store Connect API
 * @property {string} store-kit - Token type for App Store StoreKit v2 API
 */

/**
 * @typedef {("connect" | "store-kit")}
 * @description
 * TokenType represents the type of token to be generated.
 * "connect" is used for App Store Connect API,
 * "store-kit" is used for App Store StoreKit v2 API.
 * @property {string} connect - Token type for App Store Connect API
 * @property {string} store-kit - Token type for App Store StoreKit v2 API
 *
 */
type TokenType = "connect" | "store-kit"

export class AppleStoreKitToken {
  /**
   * * Generate a JWT token for Apple App Store Server API authentication
   *
   * @returns {string} - The generated JWT token
   * @throws {Error} - If the token generation fails
   * @description
   * Generates a JWT token for Apple App Store Server API authentication.
   * The token is signed with the private key and includes the issuer ID, key ID, and other claims.
   * The token is valid for 20 minutes.
   * The private key is read from the file specified in the environment variable APPLE_API_KEY_PATH.
   * The token is generated using the ES256 algorithm.
   * The token is used to authenticate requests to the Apple App Store Server API.
   */
  static token = (type: TokenType): string => {
    console.debug(`Generating Apple JWT for type: ${type}`)
    console.debug(`APP_STORE_BUNDLE_ID: ${APP_STORE_BUNDLE_ID}`)
    console.debug(`APPLE_ISSUER_ID: ${APP_STORE_ISSUER_ID}`)
    console.debug(`APP_STORE_CONNECT_KEY_ID: ${APP_STORE_CONNECT_KEY_ID}`)
    console.debug(`APP_STORE_KIT_KEY_ID: ${APP_STORE_KIT_KEY_ID}`)
    console.debug(`APP_STORE_CONNECT_KEY: ${APP_STORE_CONNECT_KEY}`)
    console.debug(`APP_STORE_KIT_KEY: ${APP_STORE_KIT_KEY}`)
    console.debug(`APP_IS_LOCAL: ${process.env.APP_IS_LOCAL}`)
    console.debug(`NODE_ENV: ${process.env.NODE_ENV}`)
    try {
      const privateKey = this.readPrivateKey(type)
      if (!privateKey) {
        throw new Error(
          `APPLE_API_KEY is not set in the environment variables: ENV: ${process.env.NODE_ENV}`
        )
      }
      const payload = {
        iss: APP_STORE_ISSUER_ID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 20 * 60, // 20 minutes
        aud: "appstoreconnect-v1",
        bid: APP_STORE_BUNDLE_ID,
      }
      const options: SignOptions = {
        header: {
          alg: "ES256",
          kid:
            type === "connect"
              ? APP_STORE_CONNECT_KEY_ID
              : APP_STORE_KIT_KEY_ID,
          typ: "JWT",
        },
      }
      const token = sign(payload, privateKey, options)
      // log.debug(`Generated Apple JWT: ${token}`)
      return token
    } catch (error) {
      console.error(error)
      console.debug(`Failed to generate Apple JWT`)
      throw error
    }
  }

  private static readPrivateKey = (type: TokenType): string => {
    // Retrieve the private key from an environment variable
    // in local this needs to read the contents of this file
    // Read the private key from the file (set the path to the key file in the environment variable APPLE_API_KEY)
    let privateKey =
      type === "connect"
        ? process.env.APP_STORE_CONNECT_KEY
        : process.env.APP_STORE_KIT_KEY
    if (!privateKey) {
      throw new Error(
        `Private key is not set for type: ${type}. Please set APP_STORE_CONNECT_KEY or APP_STORE_KIT_KEY in the environment variables.`
      )
    }
    if (process.env.APP_IS_LOCAL === "true") {
      console.debug(
        `APP is Local - Reading private key from file: ${
          type === "connect"
            ? process.env.APP_STORE_CONNECT_KEY
            : process.env.APP_STORE_KIT_KEY
        }: ENV: ${process.env.NODE_ENV}`
      )
      privateKey = fs.readFileSync(privateKey, "utf8")
    }
    return privateKey
  }
}
