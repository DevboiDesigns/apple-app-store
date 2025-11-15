import { AppleStoreKitToken } from "../src/utils/app.store.token.util"
import jwt from "jsonwebtoken"
import fs from "fs"

jest.mock("fs")

const mockedFs = fs as jest.Mocked<typeof fs>

describe("AppleStoreKitToken", () => {
  const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MOCK_PRIVATE_KEY_CONTENT
-----END PRIVATE KEY-----`

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.APP_STORE_ISSUER_ID = "test-issuer-id"
    process.env.APP_STORE_BUNDLE_ID = "com.test.app"
    process.env.APP_STORE_CONNECT_KEY_ID = "test-connect-key-id"
    process.env.APP_STORE_KIT_KEY_ID = "test-kit-key-id"
  })

  afterEach(() => {
    delete process.env.APP_IS_LOCAL
  })

  describe("token generation for 'connect' type", () => {
    it("should generate a valid JWT token", () => {
      process.env.APP_STORE_CONNECT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const token = AppleStoreKitToken.token("connect")

      expect(typeof token).toBe("string")
      expect(token.length).toBeGreaterThan(0)
    })

    it("should include correct header properties", () => {
      process.env.APP_STORE_CONNECT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const token = AppleStoreKitToken.token("connect")
      const decoded = jwt.decode(token, { complete: true })

      expect(decoded).toHaveProperty("header")
      expect(decoded?.header).toHaveProperty("alg", "ES256")
      expect(decoded?.header).toHaveProperty("kid", process.env.APP_STORE_CONNECT_KEY_ID)
      expect(decoded?.header).toHaveProperty("typ", "JWT")
    })

    it("should include correct payload properties", () => {
      process.env.APP_STORE_CONNECT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const token = AppleStoreKitToken.token("connect")
      const decoded = jwt.decode(token, { complete: true })

      expect(decoded?.payload).toHaveProperty("iss", process.env.APP_STORE_ISSUER_ID)
      expect(decoded?.payload).toHaveProperty("iat")
      expect(decoded?.payload).toHaveProperty("exp")
      expect(decoded?.payload).toHaveProperty("aud", "appstoreconnect-v1")
      expect(decoded?.payload).toHaveProperty("bid", process.env.APP_STORE_BUNDLE_ID)
    })

    it("should set token expiration to 20 minutes", () => {
      process.env.APP_STORE_CONNECT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const beforeTime = Math.floor(Date.now() / 1000)
      const token = AppleStoreKitToken.token("connect")
      const afterTime = Math.floor(Date.now() / 1000)

      const decoded = jwt.decode(token, { complete: true }) as any
      const exp = decoded.payload.exp
      const iat = decoded.payload.iat

      expect(exp - iat).toBe(20 * 60) // 20 minutes in seconds
      expect(iat).toBeGreaterThanOrEqual(beforeTime)
      expect(iat).toBeLessThanOrEqual(afterTime)
    })

    it("should read key from file when APP_IS_LOCAL is true", () => {
      const keyPath = "/path/to/key.p8"
      process.env.APP_STORE_CONNECT_KEY = keyPath
      process.env.APP_IS_LOCAL = "true"

      mockedFs.readFileSync.mockReturnValue(mockPrivateKey)

      const token = AppleStoreKitToken.token("connect")

      expect(mockedFs.readFileSync).toHaveBeenCalledWith(keyPath, "utf8")
      expect(typeof token).toBe("string")
    })

    it("should use key content directly when APP_IS_LOCAL is false", () => {
      process.env.APP_STORE_CONNECT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const token = AppleStoreKitToken.token("connect")

      expect(mockedFs.readFileSync).not.toHaveBeenCalled()
      expect(typeof token).toBe("string")
    })

    it("should throw error when APP_STORE_CONNECT_KEY is not set", () => {
      delete process.env.APP_STORE_CONNECT_KEY

      expect(() => AppleStoreKitToken.token("connect")).toThrow()
    })

    it("should throw error when APP_STORE_CONNECT_KEY is empty", () => {
      process.env.APP_STORE_CONNECT_KEY = ""

      expect(() => AppleStoreKitToken.token("connect")).toThrow()
    })
  })

  describe("token generation for 'store-kit' type", () => {
    it("should generate a valid JWT token", () => {
      process.env.APP_STORE_KIT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const token = AppleStoreKitToken.token("store-kit")

      expect(typeof token).toBe("string")
      expect(token.length).toBeGreaterThan(0)
    })

    it("should use APP_STORE_KIT_KEY_ID in header", () => {
      process.env.APP_STORE_KIT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const token = AppleStoreKitToken.token("store-kit")
      const decoded = jwt.decode(token, { complete: true })

      expect(decoded?.header).toHaveProperty("kid", process.env.APP_STORE_KIT_KEY_ID)
    })

    it("should throw error when APP_STORE_KIT_KEY is not set", () => {
      delete process.env.APP_STORE_KIT_KEY

      expect(() => AppleStoreKitToken.token("store-kit")).toThrow()
    })

    it("should read key from file when APP_IS_LOCAL is true", () => {
      const keyPath = "/path/to/storekit-key.p8"
      process.env.APP_STORE_KIT_KEY = keyPath
      process.env.APP_IS_LOCAL = "true"

      mockedFs.readFileSync.mockReturnValue(mockPrivateKey)

      const token = AppleStoreKitToken.token("store-kit")

      expect(mockedFs.readFileSync).toHaveBeenCalledWith(keyPath, "utf8")
      expect(typeof token).toBe("string")
    })
  })

  describe("error handling", () => {
    it("should throw error with descriptive message when key is missing", () => {
      delete process.env.APP_STORE_CONNECT_KEY

      expect(() => AppleStoreKitToken.token("connect")).toThrow(
        expect.stringContaining("APP_STORE_CONNECT_KEY")
      )
    })

    it("should handle file read errors when APP_IS_LOCAL is true", () => {
      const keyPath = "/path/to/key.p8"
      process.env.APP_STORE_CONNECT_KEY = keyPath
      process.env.APP_IS_LOCAL = "true"

      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error("File not found")
      })

      expect(() => AppleStoreKitToken.token("connect")).toThrow()
    })

    it("should handle invalid private key format", () => {
      process.env.APP_STORE_CONNECT_KEY = "invalid-key-format"
      process.env.APP_IS_LOCAL = "false"

      // jwt.sign will throw if key is invalid
      expect(() => AppleStoreKitToken.token("connect")).toThrow()
    })
  })

  describe("token uniqueness", () => {
    it("should generate different tokens on each call (due to iat)", () => {
      process.env.APP_STORE_CONNECT_KEY = mockPrivateKey
      process.env.APP_IS_LOCAL = "false"

      const token1 = AppleStoreKitToken.token("connect")
      // Small delay to ensure different iat
      const token2 = AppleStoreKitToken.token("connect")

      expect(token1).not.toBe(token2)
    })
  })
})

