import { TestNotification } from "../src/utils/test.notification"

describe("TestNotification Integration", () => {
  jest.setTimeout(20000) // Increase timeout for network calls

  /**
   The Apple endpoint for sending a test notification (/inApps/v1/notifications/test) requires that your app has at least one active subscription product set up in App Store Connect. If your own Apple account/app does not have any subscriptions configured, the API call will fail—often with an error like "No subscription products found" or a generic authentication/authorization error.
   */
  // * it("should send a test notification and receive a response", async () => {
  // *   await expect(TestNotification.testNotification()).resolves.not.toThrow()
  // * })

  it("should test Apple JWT token and receive a response", async () => {
    await expect(TestNotification.test()).resolves.not.toThrow()
  })
})
