import axios from "axios"
import { AppleStoreKitToken } from "../utils/app.store.token.util"

export class AppStoreLib {
  private token = AppleStoreKitToken.token("connect") // Your JWT generator
  // This class can be extended with methods related to App Store functionalities
  // For example, methods to manage apps, fetch app details, etc.

  constructor() {
    if (!this.token) {
      throw new Error("Failed to generate App Store Connect token")
    }
  }

  getApps = async () => {
    const res = await axios.get(
      "https://api.appstoreconnect.apple.com/v1/apps",
      {
        headers: { Authorization: `Bearer ${this.token}` },
      }
    )
    return res.data.data // Array of apps
  }

  getAppDetails = async (appId: string) => {
    const res = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
      }
    )
    return res.data.data // App details
  }
}
