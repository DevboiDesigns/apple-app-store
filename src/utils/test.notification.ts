import { AppleStoreKitToken } from "./app.store.token.util"
import axios from "axios"

export class TestNotification {
  // send test notification https://api.storekit.itunes.apple.com/inApps/v1/notifications/test
  // SANDBOX https://api.storekit-sandbox.itunes.apple.com/inApps/v1/notifications/test
  static testNotification = async () => {
    try {
      const response = await axios.post(
        "https://api.storekit.itunes.apple.com/inApps/v1/notifications/test",
        {
          // Add your test notification payload here
        },
        {
          headers: {
            Authorization: `Bearer ${AppleStoreKitToken.token("store-kit")}`,
          },
        }
      )

      console.log(
        `Response from Apple Test Notification: ${JSON.stringify(
          response.data
        )}`
      )
    } catch (error) {
      console.error(error)
      console.debug(`Failed to test Apple JWT`)
      throw error
    }
  }

  /**
   * * Test the Apple JWT token by making a request to the App Store Connect API
   *
   * @returns {Promise<void>} - A promise that resolves when the test is complete
   * @throws {Error} - If the test fails
   * @description
   * Tests the Apple JWT token by making a request to the App Store Connect API.
   * The token is included in the Authorization header of the request.
   * The response is logged to the console.
   */
  static test = async () => {
    try {
      console.log(`Bearer ${AppleStoreKitToken.token("connect")}`)
      const response = await axios.get(
        "https://api.appstoreconnect.apple.com/v1/apps",
        {
          headers: {
            Authorization: `Bearer ${AppleStoreKitToken.token("connect")}`,
          },
        }
      )

      console.log(`Response from Apple Test: ${JSON.stringify(response.data)}`)
    } catch (error) {
      console.error(error)
      console.debug(`Failed to test Apple JWT`)
      throw error
    }
  }
}

// // TEST
// if (require.main === module) {
//   // Run the test notification
//   TestNotification.testNotification()
//     .then(() => console.log("Test notification sent successfully"))
//     .catch((error) => console.error("Error sending test notification:", error))

//   // Run the test
//   TestNotification.test()
//     .then(() => console.log("Test completed successfully"))
//     .catch((error) => console.error("Error during test:", error))
// }
