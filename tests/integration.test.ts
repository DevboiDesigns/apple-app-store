/**
 * Integration tests for the Apple App Store Connect library
 * 
 * These tests require actual API credentials and will make real API calls.
 * They are skipped by default and should only be run when:
 * 1. All required environment variables are set
 * 2. You have valid Apple App Store Connect API credentials
 * 3. You want to test against the actual Apple API
 * 
 * To run these tests:
 * - Set all required environment variables
 * - Remove .skip from the describe block
 * - Ensure you have proper API permissions
 */

import { AppStoreLib } from "../src/libs/app.store.lib"
import { AppStoreBetaTesterLib } from "../src/libs/app.store.connect.lib"
import { AppleStoreKitToken } from "../src/utils/app.store.token.util"
import { TestNotification } from "../src/utils/test.notification"

describe.skip("Integration Tests", () => {
  // Increase timeout for real API calls
  jest.setTimeout(30000)

  const requiredEnvVars = [
    "APP_STORE_ISSUER_ID",
    "APP_STORE_BUNDLE_ID",
    "APP_APPLE_ID",
    "APP_STORE_CONNECT_KEY_ID",
    "APP_STORE_CONNECT_KEY",
  ]

  beforeAll(() => {
    // Check if all required environment variables are set
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )

    if (missingVars.length > 0) {
      console.warn(
        `Missing required environment variables: ${missingVars.join(", ")}`
      )
      console.warn("Skipping integration tests")
    }
  })

  describe("AppStoreLib Integration", () => {
    it("should fetch apps from App Store Connect API", async () => {
      const appStore = new AppStoreLib()
      const apps = await appStore.getApps()

      expect(Array.isArray(apps)).toBe(true)
      if (apps.length > 0) {
        expect(apps[0]).toHaveProperty("id")
        expect(apps[0]).toHaveProperty("type")
        expect(apps[0]).toHaveProperty("attributes")
      }
    })

    it("should fetch app details for a valid app ID", async () => {
      const appStore = new AppStoreLib()
      const apps = await appStore.getApps()

      if (apps.length > 0) {
        const appDetails = await appStore.getAppDetails(apps[0].id)
        expect(appDetails).toHaveProperty("id")
        expect(appDetails).toHaveProperty("attributes")
      }
    })
  })

  describe("AppStoreBetaTesterLib Integration", () => {
    let lib: AppStoreBetaTesterLib

    beforeAll(() => {
      lib = new AppStoreBetaTesterLib()
    })

    it("should fetch beta groups", async () => {
      const groups = await lib.getBetaGroups()

      expect(Array.isArray(groups)).toBe(true)
      if (groups.length > 0) {
        expect(groups[0]).toHaveProperty("id")
        expect(groups[0]).toHaveProperty("attributes")
        expect(groups[0].attributes).toHaveProperty("name")
      }
    })

    it("should find beta group by name", async () => {
      const groups = await lib.getBetaGroups()

      if (groups.length > 0) {
        const groupName = groups[0].attributes.name
        const groupId = await lib.getBetaGroupIdByName(groupName)

        expect(groupId).toBe(groups[0].id)
      }
    })

    it("should fetch testers in a group", async () => {
      const groups = await lib.getBetaGroups()

      if (groups.length > 0) {
        const testers = await lib.getBetaTestersInGroup(groups[0].id)

        expect(Array.isArray(testers)).toBe(true)
        if (testers.length > 0) {
          expect(testers[0]).toHaveProperty("id")
          expect(testers[0]).toHaveProperty("attributes")
          expect(testers[0].attributes).toHaveProperty("email")
        }
      }
    })

    it("should fetch all beta testers with pagination", async () => {
      const result = await lib.getBetaTesters()

      expect(result).toHaveProperty("data")
      expect(Array.isArray(result.data)).toBe(true)
      expect(result).toHaveProperty("links")
    })

    it("should fetch all testers across all pages", async () => {
      const allTesters = await lib.getAllBetaTesters()

      expect(Array.isArray(allTesters)).toBe(true)
      // Verify all testers have required properties
      allTesters.forEach((tester) => {
        expect(tester).toHaveProperty("id")
        expect(tester).toHaveProperty("attributes")
      })
    })

    it("should find tester by email", async () => {
      const allTesters = await lib.getAllBetaTesters()

      if (allTesters.length > 0 && allTesters[0].attributes?.email) {
        const email = allTesters[0].attributes.email
        const tester = await lib.getBetaTesterByEmail(email)

        if (tester) {
          expect(tester.id).toBe(allTesters[0].id)
          expect(tester.attributes.email).toBe(email)
        }
      }
    })

    // Note: These tests modify data - use with caution
    // Uncomment only if you want to test actual modifications

    // it("should add a tester to a group", async () => {
    //   const groups = await lib.getBetaGroups()
    //   if (groups.length > 0) {
    //     const testEmail = `test-${Date.now()}@example.com`
    //     await lib.addTesterToGroup(
    //       groups[0].id,
    //       testEmail,
    //       "Test",
    //       "User"
    //     )
    //
    //     const testers = await lib.getBetaTestersInGroup(groups[0].id)
    //     const addedTester = testers.find(
    //       (t: any) => t.attributes.email === testEmail
    //     )
    //     expect(addedTester).toBeDefined()
    //   }
    // })
  })

  describe("AppleStoreKitToken Integration", () => {
    it("should generate valid JWT token for connect", () => {
      const token = AppleStoreKitToken.token("connect")

      expect(typeof token).toBe("string")
      expect(token.length).toBeGreaterThan(0)

      // Verify token structure
      const parts = token.split(".")
      expect(parts.length).toBe(3) // JWT has 3 parts: header.payload.signature
    })

    it("should generate valid JWT token for store-kit", () => {
      if (process.env.APP_STORE_KIT_KEY) {
        const token = AppleStoreKitToken.token("store-kit")

        expect(typeof token).toBe("string")
        expect(token.length).toBeGreaterThan(0)

        const parts = token.split(".")
        expect(parts.length).toBe(3)
      }
    })
  })

  describe("TestNotification Integration", () => {
    it("should test App Store Connect API connection", async () => {
      await expect(TestNotification.test()).resolves.not.toThrow()
    })

    // Note: This test requires active subscription products
    // Uncomment only if you have subscriptions configured
    // it("should send test notification to StoreKit API", async () => {
    //   await expect(TestNotification.testNotification()).resolves.not.toThrow()
    // })
  })
})

