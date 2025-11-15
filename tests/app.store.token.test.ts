/**
 * Basic integration tests for AppleStoreKitToken
 * 
 * Note: More comprehensive unit tests with mocks are available in:
 * - app.store.token.util.test.ts (unit tests with full mocking)
 * 
 * This file contains basic integration tests that require actual environment variables.
 */

import { AppleStoreKitToken } from "../src/utils/app.store.token.util"
import jwt from "jsonwebtoken"

describe("AppleStoreKitToken", () => {
  it("should generate a valid JWT for 'connect'", () => {
    const token = AppleStoreKitToken.token("connect")
    expect(typeof token).toBe("string")
    // Decode the token header and payload (does not verify signature)
    const decoded = jwt.decode(token, { complete: true })
    expect(decoded).toHaveProperty("header")
    expect(decoded).toHaveProperty("payload")
    expect(decoded?.header).toHaveProperty("alg", "ES256")
    expect(decoded?.header).toHaveProperty("kid")
    expect(decoded?.payload).toHaveProperty(
      "iss",
      process.env.APP_STORE_ISSUER_ID
    )
  })

  it("should throw if private key is missing", () => {
    const originalKey = process.env.APP_STORE_CONNECT_KEY
    process.env.APP_STORE_CONNECT_KEY = ""
    expect(() => AppleStoreKitToken.token("connect")).toThrow()
    process.env.APP_STORE_CONNECT_KEY = originalKey
  })
})
