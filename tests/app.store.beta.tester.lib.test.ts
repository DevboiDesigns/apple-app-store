import { AppStoreBetaTesterLib } from "../src/libs/app.store.connect.lib"
import axios from "axios"
import { AppleStoreKitToken } from "../src/utils/app.store.token.util"

jest.mock("axios")
jest.mock("../src/utils/app.store.token.util")

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedToken = AppleStoreKitToken as jest.Mocked<typeof AppleStoreKitToken>

describe("AppStoreBetaTesterLib", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedToken.token.mockReturnValue("mock-jwt-token")
  })

  describe("constructor", () => {
    it("should initialize successfully with valid token", () => {
      mockedToken.token.mockReturnValue("valid-token")
      expect(() => new AppStoreBetaTesterLib()).not.toThrow()
    })

    it("should throw error if token generation fails", () => {
      mockedToken.token.mockReturnValue("")
      expect(() => new AppStoreBetaTesterLib()).toThrow(
        "Failed to generate App Store Connect token"
      )
    })
  })

  describe("getBetaGroups", () => {
    it("should fetch beta groups successfully", async () => {
      const mockGroups = [
        {
          id: "group-1",
          type: "betaGroups",
          attributes: { name: "Public Testing", isInternalGroup: false },
        },
        {
          id: "group-2",
          type: "betaGroups",
          attributes: { name: "Internal Testing", isInternalGroup: true },
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockGroups },
      })

      const lib = new AppStoreBetaTesterLib()
      const groups = await lib.getBetaGroups()

      expect(groups).toEqual(mockGroups)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/betaGroups"),
        {
          headers: { Authorization: "Bearer mock-jwt-token" },
        }
      )
    })

    it("should handle empty groups list", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      const lib = new AppStoreBetaTesterLib()
      const groups = await lib.getBetaGroups()

      expect(groups).toEqual([])
    })

    it("should handle API errors", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { errors: [{ detail: "Unauthorized" }] },
        },
      })

      const lib = new AppStoreBetaTesterLib()
      await expect(lib.getBetaGroups()).rejects.toThrow()
    })
  })

  describe("getBetaGroupIdByName", () => {
    it("should find group ID by name", async () => {
      const mockGroups = [
        {
          id: "group-1",
          attributes: { name: "Public Testing" },
        },
        {
          id: "group-2",
          attributes: { name: "Internal Testing" },
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockGroups },
      })

      const lib = new AppStoreBetaTesterLib()
      const groupId = await lib.getBetaGroupIdByName("Public Testing")

      expect(groupId).toBe("group-1")
    })

    it("should return null when group not found", async () => {
      const mockGroups = [
        {
          id: "group-1",
          attributes: { name: "Public Testing" },
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockGroups },
      })

      const lib = new AppStoreBetaTesterLib()
      const groupId = await lib.getBetaGroupIdByName("Non-existent Group")

      expect(groupId).toBeNull()
    })

    it("should handle case-sensitive group names", async () => {
      const mockGroups = [
        {
          id: "group-1",
          attributes: { name: "Public Testing" },
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockGroups },
      })

      const lib = new AppStoreBetaTesterLib()
      const groupId = await lib.getBetaGroupIdByName("public testing")

      expect(groupId).toBeNull()
    })
  })

  describe("getBetaTestersInGroup", () => {
    it("should fetch testers in a group successfully", async () => {
      const mockTesters = [
        {
          id: "tester-1",
          type: "betaTesters",
          attributes: {
            email: "tester1@example.com",
            firstName: "John",
            lastName: "Doe",
          },
        },
        {
          id: "tester-2",
          type: "betaTesters",
          attributes: {
            email: "tester2@example.com",
            firstName: "Jane",
            lastName: "Smith",
          },
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: mockTesters },
      })

      const lib = new AppStoreBetaTesterLib()
      const testers = await lib.getBetaTestersInGroup("group-1")

      expect(testers).toEqual(mockTesters)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/betaGroups/group-1/betaTesters"),
        {
          headers: { Authorization: "Bearer mock-jwt-token" },
        }
      )
    })

    it("should return empty array when no testers in group", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      const lib = new AppStoreBetaTesterLib()
      const testers = await lib.getBetaTestersInGroup("group-1")

      expect(testers).toEqual([])
    })
  })

  describe("getBetaTesters", () => {
    it("should fetch testers with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: "tester-1",
            attributes: { email: "tester1@example.com" },
          },
        ],
        links: {
          next: "https://api.appstoreconnect.apple.com/v1/betaTesters?cursor=next",
        },
      }

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResponse,
      })

      const lib = new AppStoreBetaTesterLib()
      const result = await lib.getBetaTesters()

      expect(result).toEqual(mockResponse)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/betaTesters?limit=200"),
        {
          headers: { Authorization: "Bearer mock-jwt-token" },
        }
      )
    })

    it("should use nextUrl when provided", async () => {
      const nextUrl = "https://api.appstoreconnect.apple.com/v1/betaTesters?cursor=next"
      const mockResponse = {
        data: [{ id: "tester-2", attributes: { email: "tester2@example.com" } }],
        links: {},
      }

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResponse,
      })

      const lib = new AppStoreBetaTesterLib()
      const result = await lib.getBetaTesters(nextUrl)

      expect(result).toEqual(mockResponse)
      expect(mockedAxios.get).toHaveBeenCalledWith(nextUrl, {
        headers: { Authorization: "Bearer mock-jwt-token" },
      })
    })
  })

  describe("getAllBetaTesters", () => {
    it("should fetch all testers across multiple pages", async () => {
      const page1 = {
        data: [{ id: "tester-1", attributes: { email: "tester1@example.com" } }],
        links: {
          next: "https://api.appstoreconnect.apple.com/v1/betaTesters?cursor=next",
        },
      }

      const page2 = {
        data: [{ id: "tester-2", attributes: { email: "tester2@example.com" } }],
        links: {},
      }

      mockedAxios.get
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: page2 })

      const lib = new AppStoreBetaTesterLib()
      const allTesters = await lib.getAllBetaTesters()

      expect(allTesters).toHaveLength(2)
      expect(allTesters[0].id).toBe("tester-1")
      expect(allTesters[1].id).toBe("tester-2")
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })

    it("should handle single page of testers", async () => {
      const mockResponse = {
        data: [{ id: "tester-1", attributes: { email: "tester1@example.com" } }],
        links: {},
      }

      mockedAxios.get.mockResolvedValueOnce({
        data: mockResponse,
      })

      const lib = new AppStoreBetaTesterLib()
      const allTesters = await lib.getAllBetaTesters()

      expect(allTesters).toHaveLength(1)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    })
  })

  describe("getBetaTesterByEmail", () => {
    it("should find tester by email", async () => {
      const mockTester = {
        id: "tester-1",
        type: "betaTesters",
        attributes: {
          email: "tester@example.com",
          firstName: "John",
          lastName: "Doe",
        },
      }

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [mockTester] },
      })

      const lib = new AppStoreBetaTesterLib()
      const tester = await lib.getBetaTesterByEmail("tester@example.com")

      expect(tester).toEqual(mockTester)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("filter[email]=tester%40example.com"),
        {
          headers: { Authorization: "Bearer mock-jwt-token" },
        }
      )
    })

    it("should return null when tester not found", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      const lib = new AppStoreBetaTesterLib()
      const tester = await lib.getBetaTesterByEmail("nonexistent@example.com")

      expect(tester).toBeNull()
    })

    it("should handle API errors gracefully", async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { errors: [{ detail: "Internal server error" }] },
        },
      })

      const lib = new AppStoreBetaTesterLib()
      const tester = await lib.getBetaTesterByEmail("tester@example.com")

      expect(tester).toBeNull()
    })

    it("should handle network errors gracefully", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"))

      const lib = new AppStoreBetaTesterLib()
      const tester = await lib.getBetaTesterByEmail("tester@example.com")

      expect(tester).toBeNull()
    })
  })

  describe("addTesterToGroup", () => {
    it("should create new tester and add to group successfully", async () => {
      const mockCreatedTester = {
        data: {
          id: "tester-1",
          type: "betaTesters",
        },
      }

      mockedAxios.post
        .mockResolvedValueOnce({ data: mockCreatedTester })
        .mockResolvedValueOnce({ data: {} })

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroup(
        "group-1",
        "newtester@example.com",
        "John",
        "Doe"
      )

      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        "https://api.appstoreconnect.apple.com/v1/betaTesters",
        expect.objectContaining({
          data: expect.objectContaining({
            type: "betaTesters",
            attributes: expect.objectContaining({
              email: "newtester@example.com",
              firstName: "John",
              lastName: "Doe",
            }),
            relationships: expect.objectContaining({
              betaGroups: expect.any(Object),
            }),
          }),
        }),
        expect.any(Object)
      )
    })

    it("should handle tester already exists (409) and find existing tester", async () => {
      const mockTester = {
        id: "existing-tester-1",
        attributes: { email: "existing@example.com" },
      }

      // Mock 409 error on create
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            errors: [
              {
                detail: "Tester already exists",
              },
            ],
          },
        },
      })

      // Mock successful email lookup
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { data: [mockTester] },
        })
        .mockResolvedValueOnce({
          data: { data: [] },
        })

      // Mock successful add to group
      mockedAxios.post.mockResolvedValueOnce({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroup("group-1", "existing@example.com")

      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it("should handle tester already in group", async () => {
      const mockCreatedTester = {
        data: {
          id: "tester-1",
          type: "betaTesters",
        },
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockCreatedTester })

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: "tester-1",
              attributes: { email: "tester@example.com" },
            },
          ],
        },
      })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroup("group-1", "tester@example.com")

      // Should return early without calling add endpoint
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    })

    it("should handle 409 conflict when adding to group (race condition)", async () => {
      const mockCreatedTester = {
        data: {
          id: "tester-1",
          type: "betaTesters",
        },
      }

      mockedAxios.post
        .mockResolvedValueOnce({ data: mockCreatedTester })
        .mockRejectedValueOnce({
          response: {
            status: 409,
            data: { errors: [{ detail: "Already in group" }] },
          },
        })

      mockedAxios.get
        .mockResolvedValueOnce({
          data: { data: [] },
        })
        .mockResolvedValueOnce({
          data: {
            data: [
              {
                id: "tester-1",
                attributes: { email: "tester@example.com" },
              },
            ],
          },
        })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroup("group-1", "tester@example.com")

      // Should verify tester is in group and return successfully
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })

    it("should handle relationship required error and find tester", async () => {
      const mockTester = {
        id: "tester-1",
        attributes: { email: "tester@example.com" },
      }

      // Mock relationship required error
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            errors: [
              {
                detail: "Either betaGroups or builds relationship is required when creating betaTesters",
              },
            ],
          },
        },
      })

      // Mock successful email lookup
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { data: [mockTester] },
        })
        .mockResolvedValueOnce({
          data: { data: [] },
        })

      // Mock successful add to group
      mockedAxios.post.mockResolvedValueOnce({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroup("group-1", "tester@example.com")

      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
    })

    it("should handle fallback to search all testers when email filter fails", async () => {
      const mockTester = {
        id: "tester-1",
        attributes: { email: "tester@example.com" },
      }

      // Mock 409 error
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            errors: [{ detail: "Tester already exists" }],
          },
        },
      })

      // Mock email filter returns empty
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      // Mock getAllBetaTesters
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [mockTester],
          links: {},
        },
      })

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      mockedAxios.post.mockResolvedValueOnce({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroup("group-1", "tester@example.com")

      expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    })

    it("should handle null email in tester search", async () => {
      // Mock 409 error
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            errors: [{ detail: "Tester already exists" }],
          },
        },
      })

      // Mock email filter returns empty
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      // Mock getAllBetaTesters with some testers having null email
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            { id: "tester-1", attributes: { email: null } },
            { id: "tester-2", attributes: { email: "tester@example.com" } },
          ],
          links: {},
        },
      })

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      mockedAxios.post.mockResolvedValueOnce({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroup("group-1", "tester@example.com")

      // Should find tester-2 and add to group
      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
    })

    it("should throw error when tester cannot be found after 409", async () => {
      // Mock 409 error
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            errors: [{ detail: "Tester already exists" }],
          },
        },
      })

      // Mock all search strategies fail
      mockedAxios.get
        .mockResolvedValueOnce({ data: { data: [] } }) // Email filter
        .mockResolvedValueOnce({
          data: { data: [], links: {} },
        }) // getAllBetaTesters

      const lib = new AppStoreBetaTesterLib()
      await expect(
        lib.addTesterToGroup("group-1", "nonexistent@example.com")
      ).rejects.toThrow("already exists but could not be found")
    })

    it("should handle 404 when group not found", async () => {
      const mockCreatedTester = {
        data: {
          id: "tester-1",
          type: "betaTesters",
        },
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockCreatedTester })

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { errors: [{ detail: "Group not found" }] },
        },
      })

      const lib = new AppStoreBetaTesterLib()
      await expect(
        lib.addTesterToGroup("invalid-group", "tester@example.com")
      ).rejects.toThrow("Group")
    })

    it("should handle 403 permission denied", async () => {
      const mockCreatedTester = {
        data: {
          id: "tester-1",
          type: "betaTesters",
        },
      }

      mockedAxios.post.mockResolvedValueOnce({ data: mockCreatedTester })

      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { errors: [{ detail: "Permission denied" }] },
        },
      })

      const lib = new AppStoreBetaTesterLib()
      await expect(
        lib.addTesterToGroup("group-1", "tester@example.com")
      ).rejects.toThrow("Permission denied")
    })
  })

  describe("addTesterToGroupByName", () => {
    it("should add tester to group by name successfully", async () => {
      const mockGroups = [
        {
          id: "group-1",
          attributes: { name: "Public Testing" },
        },
      ]

      const mockCreatedTester = {
        data: {
          id: "tester-1",
          type: "betaTesters",
        },
      }

      mockedAxios.get
        .mockResolvedValueOnce({ data: { data: mockGroups } })
        .mockResolvedValueOnce({ data: { data: [] } })

      mockedAxios.post
        .mockResolvedValueOnce({ data: mockCreatedTester })
        .mockResolvedValueOnce({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.addTesterToGroupByName(
        "Public Testing",
        "tester@example.com",
        "John",
        "Doe"
      )

      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
    })

    it("should throw error when group not found", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      const lib = new AppStoreBetaTesterLib()
      await expect(
        lib.addTesterToGroupByName("Non-existent", "tester@example.com")
      ).rejects.toThrow('Beta group "Non-existent" not found')
    })
  })

  describe("removeTesterFromGroup", () => {
    it("should remove tester from group successfully", async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.removeTesterFromGroup("group-1", "tester-1")

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/betaGroups/group-1/relationships/betaTesters"),
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-jwt-token" },
          data: {
            data: [{ type: "betaTesters", id: "tester-1" }],
          },
        })
      )
    })

    it("should handle errors when removing tester", async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { errors: [{ detail: "Tester not found in group" }] },
        },
      })

      const lib = new AppStoreBetaTesterLib()
      await expect(
        lib.removeTesterFromGroup("group-1", "invalid-tester")
      ).rejects.toThrow()
    })
  })

  describe("updatePublicTestingGroup", () => {
    it("should update Public Testing group with new email list", async () => {
      const mockGroups = [
        {
          id: "group-1",
          attributes: { name: "Public Testing" },
        },
      ]

      const existingTesters = [
        {
          id: "tester-1",
          attributes: { email: "old1@example.com" },
        },
        {
          id: "tester-2",
          attributes: { email: "old2@example.com" },
        },
      ]

      const newEmails = ["new1@example.com", "new2@example.com"]

      mockedAxios.get
        .mockResolvedValueOnce({ data: { data: mockGroups } })
        .mockResolvedValueOnce({ data: { data: existingTesters } })

      mockedAxios.post.mockResolvedValue({ data: {} })
      mockedAxios.delete.mockResolvedValue({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.updatePublicTestingGroup(newEmails)

      // Should add 2 new testers and remove 2 old ones
      expect(mockedAxios.post).toHaveBeenCalledTimes(2)
      expect(mockedAxios.delete).toHaveBeenCalledTimes(2)
    })

    it("should handle when Public Testing group doesn't exist", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [] },
      })

      const lib = new AppStoreBetaTesterLib()
      await expect(
        lib.updatePublicTestingGroup(["tester@example.com"])
      ).rejects.toThrow("Public Testing group not found")
    })

    it("should not add testers already in group", async () => {
      const mockGroups = [
        {
          id: "group-1",
          attributes: { name: "Public Testing" },
        },
      ]

      const existingTesters = [
        {
          id: "tester-1",
          attributes: { email: "existing@example.com" },
        },
      ]

      const emails = ["existing@example.com", "new@example.com"]

      mockedAxios.get
        .mockResolvedValueOnce({ data: { data: mockGroups } })
        .mockResolvedValueOnce({ data: { data: existingTesters } })

      mockedAxios.post.mockResolvedValue({ data: {} })

      const lib = new AppStoreBetaTesterLib()
      await lib.updatePublicTestingGroup(emails)

      // Should only add the new tester, not the existing one
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    })
  })
})

