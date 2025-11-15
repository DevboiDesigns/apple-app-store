import { AppStoreLib } from "../src/libs/app.store.lib"
import axios from "axios"
import { AppleStoreKitToken } from "../src/utils/app.store.token.util"

jest.mock("axios")
jest.mock("../src/utils/app.store.token.util")

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedToken = AppleStoreKitToken as jest.Mocked<typeof AppleStoreKitToken>

describe("AppStoreLib", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedToken.token.mockReturnValue("mock-jwt-token")
  })

  describe("constructor", () => {
    it("should initialize successfully with valid token", () => {
      mockedToken.token.mockReturnValue("valid-token")
      expect(() => new AppStoreLib()).not.toThrow()
    })

    it("should throw error if token generation fails", () => {
      mockedToken.token.mockReturnValue("")
      expect(() => new AppStoreLib()).toThrow(
        "Failed to generate App Store Connect token"
      )
    })

    it("should throw error if token is null", () => {
      mockedToken.token.mockReturnValue(null as any)
      expect(() => new AppStoreLib()).toThrow(
        "Failed to generate App Store Connect token"
      )
    })
  })

  describe("getApps", () => {
    it("should fetch all apps successfully", async () => {
      const mockApps = [
        {
          id: "app-1",
          type: "apps",
          attributes: { name: "Test App 1", bundleId: "com.test.app1" },
        },
        {
          id: "app-2",
          type: "apps",
          attributes: { name: "Test App 2", bundleId: "com.test.app2" },
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockApps },
      })

      const appStore = new AppStoreLib()
      const apps = await appStore.getApps()

      expect(apps).toEqual(mockApps)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.appstoreconnect.apple.com/v1/apps",
        {
          headers: { Authorization: "Bearer mock-jwt-token" },
        }
      )
    })

    it("should handle API errors", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { errors: [{ detail: "Unauthorized" }] },
        },
      })

      const appStore = new AppStoreLib()
      await expect(appStore.getApps()).rejects.toThrow()
    })

    it("should handle network errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"))

      const appStore = new AppStoreLib()
      await expect(appStore.getApps()).rejects.toThrow("Network error")
    })

    it("should return empty array when no apps exist", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      const appStore = new AppStoreLib()
      const apps = await appStore.getApps()

      expect(apps).toEqual([])
    })
  })

  describe("getAppDetails", () => {
    it("should fetch app details successfully", async () => {
      const mockAppDetails = {
        id: "app-1",
        type: "apps",
        attributes: {
          name: "Test App",
          bundleId: "com.test.app",
          sku: "TEST123",
        },
      }

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockAppDetails },
      })

      const appStore = new AppStoreLib()
      const appDetails = await appStore.getAppDetails("app-1")

      expect(appDetails).toEqual(mockAppDetails)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.appstoreconnect.apple.com/v1/apps/app-1",
        {
          headers: { Authorization: "Bearer mock-jwt-token" },
        }
      )
    })

    it("should handle 404 when app not found", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { errors: [{ detail: "App not found" }] },
        },
      })

      const appStore = new AppStoreLib()
      await expect(appStore.getAppDetails("invalid-id")).rejects.toThrow()
    })

    it("should handle invalid app ID", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { errors: [{ detail: "Invalid app ID" }] },
        },
      })

      const appStore = new AppStoreLib()
      await expect(appStore.getAppDetails("")).rejects.toThrow()
    })
  })
})

