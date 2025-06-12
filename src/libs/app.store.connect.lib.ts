import axios from "axios"
import { AppleStoreKitToken } from "../utils/app.store.token.util"
import { APP_APPLE_ID } from "../config/env.keys"

export class AppStoreConnectLib {}

export class AppStoreBetaTesterLib {
  private token = AppleStoreKitToken.token("connect") // Your JWT generator
  constructor() {
    if (!this.token) {
      throw new Error("Failed to generate App Store Connect token")
    }
  }

  /**
   * * Add a tester to a beta group by group name.
   * @param groupName Name of the beta group
   * @param email Email address of the tester
   * @param firstName First name of the tester
   * @param lastName Last name of the tester
   */
  addTesterToGroupByName = async (
    groupName: string,
    email: string,
    firstName?: string,
    lastName?: string
  ) => {
    const groupId = await this.getBetaGroupIdByName(groupName)
    if (!groupId) {
      throw new Error(`Beta group "${groupName}" not found`)
    }
    await this.addTesterToGroup(groupId, email, firstName, lastName)
  }

  // Get all beta groups for the app
  getBetaGroups = async () => {
    console.log("Fetching beta groups for APP_APPLE_ID:", APP_APPLE_ID)
    const res = await axios.get(
      `https://api.appstoreconnect.apple.com/v1/apps/${APP_APPLE_ID}/betaGroups`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
      }
    )
    console.log("Beta groups response:", res.data)
    return res.data.data // Array of groups
  }

  // Get beta group ID by group name
  getBetaGroupIdByName = async (groupName: string) => {
    const groups = await this.getBetaGroups()
    console.log(
      "Available groups:",
      groups.map((g: any) => g.attributes.name)
    )
    const group = groups.find((g: any) => g.attributes.name === groupName)
    if (!group) {
      console.error(`Group "${groupName}" not found.`)
    }
    return group ? group.id : null
  }

  // List all testers in a specific beta group
  getBetaTestersInGroup = async (betaGroupId: string) => {
    const url = `https://api.appstoreconnect.apple.com/v1/betaGroups/${betaGroupId}/betaTesters`
    console.log("Fetching testers in group:", url)
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    })
    console.log("Testers in group response:", res.data)
    return res.data.data // Array of testers in the group
  }

  // List all testers (across all groups), paginated
  getBetaTesters = async (nextUrl?: string) => {
    const url =
      nextUrl ||
      `https://api.appstoreconnect.apple.com/v1/betaTesters?limit=200`
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    })
    return res.data // returns { data, links }
  }

  // Fetch all testers across all pages
  getAllBetaTesters = async () => {
    let testers: any[] = []
    let nextUrl: string | undefined = undefined
    do {
      const res = await this.getBetaTesters(nextUrl)
      testers = testers.concat(res.data)
      nextUrl = res.links && res.links.next ? res.links.next : undefined
    } while (nextUrl)
    return testers
  }

  /**
   * * Add a tester to a beta group.
   * If the tester does not exist, they will be created.
   * If the tester already exists, they will be added to the group.
   * @param betaGroupId
   * @param email
   * @param firstName
   * @param lastName
   */
  addTesterToGroup = async (
    betaGroupId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ) => {
    let testerId: string | null = null
    try {
      // 1. Create the tester if they don't exist
      const createRes = await axios.post(
        `https://api.appstoreconnect.apple.com/v1/betaTesters`,
        {
          data: {
            type: "betaTesters",
            attributes: {
              email,
              ...(firstName ? { firstName } : {}),
              ...(lastName ? { lastName } : {}),
            },
          },
        },
        { headers: { Authorization: `Bearer ${this.token}` } }
      )
      testerId = createRes.data.data.id
      console.log(`Created tester with id: ${testerId} for email: ${email}`)
    } catch (err: any) {
      // If tester already exists, find their ID
      if (err.response && err.response.status === 409) {
        // Try to fetch tester by email using filter
        const tester = await this.getBetaTesterByEmail(email)
        testerId = tester ? tester.id : null
        console.log(
          `Tester already exists. Found id: ${testerId} for email: ${email}`
        )
      } else {
        console.error("Error creating tester:", err.response?.data || err)
        throw err
      }
    }
    if (!testerId) throw new Error("Tester not found or could not be created")

    // 2. Add tester to group using the documented endpoint
    const url = `https://api.appstoreconnect.apple.com/v1/betaGroups/${betaGroupId}/relationships/betaTesters`
    try {
      await axios.post(
        url,
        {
          data: [{ type: "betaTesters", id: testerId }],
        },
        { headers: { Authorization: `Bearer ${this.token}` } }
      )
      console.log(
        `Successfully added tester ${testerId} to group ${betaGroupId}`
      )
    } catch (err: any) {
      console.error("Error adding tester to group:", err.response?.data || err)
      throw err
    }
  }

  // Remove a tester from a group
  removeTesterFromGroup = async (betaGroupId: string, testerId: string) => {
    await axios.delete(
      `https://api.appstoreconnect.apple.com/v1/betaGroups/${betaGroupId}/relationships/betaTesters`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
        data: { data: [{ type: "betaTesters", id: testerId }] },
      }
    )
  }

  /**
   * * Update the "Public Testing" beta group to match a new list of email addresses.
   * @param emails Array of email addresses to update in the "Public Testing" group.
   */
  updatePublicTestingGroup = async (emails: string[]) => {
    const groupId = await this.getBetaGroupIdByName("Public Testing")
    if (!groupId) throw new Error("Public Testing group not found")

    // Get current testers in the group
    const currentTesters = await this.getBetaTestersInGroup(groupId)
    const currentEmails = currentTesters.map((t: any) => t.attributes.email)

    // Add new testers
    for (const email of emails) {
      if (!currentEmails.includes(email)) {
        await this.addTesterToGroup(groupId, email)
      }
    }

    // Remove testers not in the new list
    for (const tester of currentTesters) {
      if (!emails.includes(tester.attributes.email)) {
        await this.removeTesterFromGroup(groupId, tester.id)
      }
    }
  }

  // Fetch a tester by email using the filter endpoint
  getBetaTesterByEmail = async (email: string) => {
    const url = `https://api.appstoreconnect.apple.com/v1/betaTesters?filter[email]=${encodeURIComponent(email)}`
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    })
    return res.data.data && res.data.data.length > 0 ? res.data.data[0] : null
  }
}

//**************** TEST SETUP ***********************/
// Usage example: update "Public Testing" group to match a new email list
;(async () => {
  const service = new AppStoreBetaTesterLib()
  await service.addTesterToGroupByName(
    "Public Testing",
    "sara@gmail.com",
    "Christopher",
    "Infinity"
  )
})()
