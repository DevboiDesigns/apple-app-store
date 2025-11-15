import { TestNotification } from "../src/utils/test.notification"
import axios from "axios"
import { AppleStoreKitToken } from "../src/utils/app.store.token.util"

jest.mock("axios")
jest.mock("../src/utils/app.store.token.util")

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedToken = AppleStoreKitToken as jest.Mocked<typeof AppleStoreKitToken>

describe("TestNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedToken.token.mockReturnValue("mock-jwt-token")
  })

  describe("test", () => {
    it("should successfully test App Store Connect API connection", async () => {
      const mockApps = [
        {
          id: "app-1",
          type: "apps",
          attributes: { name: "Test App" },
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockApps },
      })

      await expect(TestNotification.test()).resolves.not.toThrow()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.appstoreconnect.apple.com/v1/apps",
        {
          headers: {
            Authorization: "Bearer mock-jwt-token",
          },
        }
      )
    })

    it("should handle API authentication errors", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { errors: [{ detail: "Unauthorized" }] },
        },
      })

      await expect(TestNotification.test()).rejects.toThrow()
    })

    it("should handle network errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"))

      await expect(TestNotification.test()).rejects.toThrow("Network error")
    })

    it("should handle timeout errors", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        code: "ECONNABORTED",
        message: "timeout of 5000ms exceeded",
      })

      await expect(TestNotification.test()).rejects.toThrow()
    })

    it("should use correct token type for App Store Connect", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      await TestNotification.test()

      expect(mockedToken.token).toHaveBeenCalledWith("connect")
    })
  })

  describe("testNotification", () => {
    it("should send test notification successfully", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { status: "success" },
      })

      await expect(TestNotification.testNotification()).resolves.not.toThrow()

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://api.storekit.itunes.apple.com/inApps/v1/notifications/test",
        {},
        {
          headers: {
            Authorization: "Bearer mock-jwt-token",
          },
        }
      )
    })

    it("should use correct token type for StoreKit", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { status: "success" },
      })

      await TestNotification.testNotification()

      expect(mockedToken.token).toHaveBeenCalledWith("store-kit")
    })

    it("should handle no subscription products error", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            errors: [
              {
                detail: "No subscription products found",
              },
            ],
          },
        },
      })

      await expect(TestNotification.testNotification()).rejects.toThrow()
    })

    it("should handle authentication errors", async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { errors: [{ detail: "Unauthorized" }] },
        },
      })

      await expect(TestNotification.testNotification()).rejects.toThrow()
    })

    it("should handle network errors", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"))

      await expect(TestNotification.testNotification()).rejects.toThrow(
        "Network error"
      )
    })

    it("should send empty payload for test notification", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { status: "success" },
      })

      await TestNotification.testNotification()

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        {},
        expect.any(Object)
      )
    })
  })
})

