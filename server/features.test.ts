import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getAllLanes: vi.fn().mockResolvedValue([
    { id: 1, code: "AC", name: "Academic Core", createdAt: new Date(), updatedAt: new Date() },
    { id: 2, code: "MT", name: "Micro Teaching", createdAt: new Date(), updatedAt: new Date() },
  ]),
  createLane: vi.fn().mockResolvedValue({ id: 3, code: "DG", name: "Demand Generation" }),
  updateLane: vi.fn().mockResolvedValue({ id: 1, code: "AC", name: "Academic Core Updated" }),
  deleteLane: vi.fn().mockResolvedValue(true),
  getAllPillars: vi.fn().mockResolvedValue([
    { id: 1, code: "LR", name: "Learning Resources", createdAt: new Date(), updatedAt: new Date() },
  ]),
  createPillar: vi.fn().mockResolvedValue({ id: 2, code: "PF", name: "Platform" }),
  updatePillar: vi.fn().mockResolvedValue({}),
  deletePillar: vi.fn().mockResolvedValue(true),
  getAllSeries: vi.fn().mockResolvedValue([
    { id: 1, code: "W1", name: "Writing Task 1", laneId: 1, pillarId: 1, createdAt: new Date(), updatedAt: new Date() },
  ]),
  createSeries: vi.fn().mockResolvedValue({ id: 2, code: "S1", name: "Speaking Part 1" }),
  updateSeries: vi.fn().mockResolvedValue({}),
  deleteSeries: vi.fn().mockResolvedValue(true),
  getAllAngles: vi.fn().mockResolvedValue([
    { id: 1, code: "CMP", name: "Compare", createdAt: new Date(), updatedAt: new Date() },
  ]),
  createAngle: vi.fn().mockResolvedValue({ id: 2, code: "HOW", name: "How-to" }),
  updateAngle: vi.fn().mockResolvedValue({}),
  deleteAngle: vi.fn().mockResolvedValue(true),
  getAllPosts: vi.fn().mockResolvedValue([
    {
      id: 1, postCode: "LR.W1.001W1", weekLabel: "W1 Apr 2026", date: "2026-03-31",
      day: "Tue", slotType: "Main", laneCode: "AC", pillarCode: "LR", seriesCode: "W1",
      topic: "Writing Task 1: Week 1 Example", format: "Carousel/Static",
      approvalLevel: "Expert Review", difficultyScore: 4, status: "Planned",
      priority: "Core", funnelStage: "Service", notes: "",
      caption: null, hashtags: null, cta: null, archived: 0,
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  createPost: vi.fn().mockResolvedValue({ id: 2, postCode: "NEW.001" }),
  updatePost: vi.fn().mockResolvedValue({}),
  deletePost: vi.fn().mockResolvedValue(true),
  getAllContentIdeas: vi.fn().mockResolvedValue([
    {
      id: 1, menuId: "M1", laneCode: "DG", pillarCode: "AS", seriesCode: "AS.EA",
      ideaTitle: "Test Idea", description: "Test desc", readinessStatus: "Adapt",
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  createContentIdea: vi.fn().mockResolvedValue({ id: 2, menuId: "M31" }),
  updateContentIdea: vi.fn().mockResolvedValue({}),
  deleteContentIdea: vi.fn().mockResolvedValue(true),
  promoteIdeaToPost: vi.fn().mockResolvedValue({ id: 10, postCode: "AS.EA.M1" }),
  getAllOptionalPosts: vi.fn().mockResolvedValue([
    {
      id: 1, postCode: "LR.ID.OP11", topic: "Quick Optional: Idioms",
      laneCode: "MT", whyEasy: "Easy", whenToUse: "Busy week",
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  createOptionalPost: vi.fn().mockResolvedValue({ id: 2 }),
  updateOptionalPost: vi.fn().mockResolvedValue({}),
  deleteOptionalPost: vi.fn().mockResolvedValue(true),
  activateOptionalPost: vi.fn().mockResolvedValue({ id: 20, postCode: "LR.ID.OP11" }),
  getAllVideos: vi.fn().mockResolvedValue([
    {
      id: 1, videoId: "SS.SI.001", topic: "Student Interview", productionStage: "Ready",
      script: "Interview script here",
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  createVideo: vi.fn().mockResolvedValue({ id: 2 }),
  updateVideo: vi.fn().mockResolvedValue({}),
  deleteVideo: vi.fn().mockResolvedValue(true),
  advanceVideoStage: vi.fn().mockResolvedValue({}),
  getAllMetrics: vi.fn().mockResolvedValue([]),
  createMetric: vi.fn().mockResolvedValue({ id: 1 }),
  updateMetric: vi.fn().mockResolvedValue({}),
  deleteMetric: vi.fn().mockResolvedValue(true),
  getAllBacklog: vi.fn().mockResolvedValue([
    { id: 1, legacyCode: "BT.PT.001", topic: "Placement Test Intro", createdAt: new Date(), updatedAt: new Date() },
  ]),
  createBacklogItem: vi.fn().mockResolvedValue({ id: 2 }),
  updateBacklogItem: vi.fn().mockResolvedValue({}),
  deleteBacklogItem: vi.fn().mockResolvedValue(true),
  reviveBacklogItem: vi.fn().mockResolvedValue({ id: 30, postCode: "PF.PT.001" }),
  getDashboardStats: vi.fn().mockResolvedValue({
    mainPosts: 27, optionalPosts: 27, videos: 8, avgDifficulty: 3,
    approvalBurden: 49, maxApproval: 81, laneMix: [{ lane: "AC", count: 9 }],
    academicMinMet: true, upcomingPosts: [],
  }),
  getActivityLog: vi.fn().mockResolvedValue([]),
  importExcel: vi.fn().mockResolvedValue({ sheets: {} }),
  exportExcel: vi.fn().mockResolvedValue({ data: "base64data" }),
  exportCsv: vi.fn().mockResolvedValue("postCode,topic\nAC.001,Test"),
  searchPosts: vi.fn().mockResolvedValue([]),
  bulkInsertLanes: vi.fn().mockResolvedValue(undefined),
  bulkInsertPillars: vi.fn().mockResolvedValue(undefined),
  bulkInsertAngles: vi.fn().mockResolvedValue(undefined),
  bulkInsertSeries: vi.fn().mockResolvedValue(undefined),
  bulkInsertPosts: vi.fn().mockResolvedValue({ imported: 5, skipped: 0 }),
  bulkInsertContentIdeas: vi.fn().mockResolvedValue({ imported: 3, skipped: 0 }),
  bulkInsertOptionalPosts: vi.fn().mockResolvedValue({ imported: 2, skipped: 0 }),
  bulkInsertVideos: vi.fn().mockResolvedValue({ imported: 1, skipped: 0 }),
  bulkInsertBacklog: vi.fn().mockResolvedValue({ imported: 1, skipped: 0 }),
  // V2 features
  getCalendarNotes: vi.fn().mockResolvedValue([
    { id: 1, date: "2026-04-01", title: "Deadline W1", type: "deadline", done: 0, color: "#ef4444", createdAt: new Date(), updatedAt: new Date() },
  ]),
  createCalendarNote: vi.fn().mockResolvedValue({ id: 2 }),
  updateCalendarNote: vi.fn().mockResolvedValue({}),
  deleteCalendarNote: vi.fn().mockResolvedValue(true),
  toggleCalendarNote: vi.fn().mockResolvedValue({}),
  getAllWhiteboards: vi.fn().mockResolvedValue([
    { id: 1, title: "Brainstorm W1", data: '{"nodes":[]}', createdAt: new Date(), updatedAt: new Date() },
  ]),
  getWhiteboard: vi.fn().mockResolvedValue({ id: 1, title: "Brainstorm W1", data: '{"nodes":[]}', createdAt: new Date(), updatedAt: new Date() }),
  createWhiteboard: vi.fn().mockResolvedValue({ id: 2 }),
  updateWhiteboard: vi.fn().mockResolvedValue({}),
  deleteWhiteboard: vi.fn().mockResolvedValue(true),
  getAllCopyTemplates: vi.fn().mockResolvedValue([
    { id: 1, name: "Carousel Template", structure: "Hook → Body → CTA", example: "Example text", createdAt: new Date(), updatedAt: new Date() },
  ]),
  createCopyTemplate: vi.fn().mockResolvedValue({ id: 2 }),
  updateCopyTemplate: vi.fn().mockResolvedValue({}),
  deleteCopyTemplate: vi.fn().mockResolvedValue(true),
  archivePost: vi.fn().mockResolvedValue({}),
  unarchivePost: vi.fn().mockResolvedValue({}),
  getArchivedPosts: vi.fn().mockResolvedValue([
    { id: 1, postCode: "AC.W1.001", topic: "Archived Post", archived: 1, archiveMonth: "2026-03", createdAt: new Date(), updatedAt: new Date() },
  ]),
  updatePostCopywriting: vi.fn().mockResolvedValue({}),
}));

function createTestContext(authenticated = true): TrpcContext {
  const user = authenticated
    ? {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("Taxonomy Routers", () => {
  it("lists all lanes", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.lanes.list();
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe("AC");
  });

  it("creates a lane (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.lanes.create({ code: "DG", name: "Demand Generation" });
    expect(result).toBeDefined();
  });

  it("lists all pillars", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pillars.list();
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("LR");
  });

  it("lists all series", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.series.list();
    expect(result).toHaveLength(1);
  });

  it("lists all angles", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.angles.list();
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("CMP");
  });
});

describe("Posts Router", () => {
  it("lists all posts", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.posts.list();
    expect(result).toHaveLength(1);
    expect(result[0].postCode).toBe("LR.W1.001W1");
  });

  it("creates a post (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.posts.create({
      postCode: "NEW.001",
      weekLabel: "W1",
      topic: "New Post",
      laneCode: "AC",
      pillarCode: "LR",
      seriesCode: "W1",
    });
    expect(result).toBeDefined();
  });

  it("rejects unauthenticated post creation", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.posts.create({
        postCode: "NEW.001",
        weekLabel: "W1",
        topic: "New Post",
        laneCode: "AC",
        pillarCode: "LR",
        seriesCode: "W1",
      })
    ).rejects.toThrow();
  });
});

describe("Content Ideas Router", () => {
  it("lists all content ideas", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ideas.list();
    expect(result).toHaveLength(1);
    expect(result[0].menuId).toBe("M1");
  });

  it("promotes an idea to a post", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ideas.promote({ ideaId: 1, postCode: "AS.EA.M1" });
    expect(result).toBeDefined();
  });
});

describe("Optional Posts Router", () => {
  it("lists all optional posts", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.optional.list();
    expect(result).toHaveLength(1);
    expect(result[0].postCode).toBe("LR.ID.OP11");
  });

  it("activates an optional post", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.optional.activate({ optionalId: 1 });
    expect(result).toBeDefined();
  });
});

describe("Videos Router", () => {
  it("lists all videos", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.videos.list();
    expect(result).toHaveLength(1);
    expect(result[0].videoId).toBe("SS.SI.001");
  });

  it("updates a video", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.videos.update({ id: 1, productionStage: "Script" });
    expect(result).toBeDefined();
  });
});

describe("Backlog Router", () => {
  it("lists all backlog items", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.backlog.list();
    expect(result).toHaveLength(1);
    expect(result[0].legacyCode).toBe("BT.PT.001");
  });

  it("revives a backlog item", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.backlog.revive({ backlogId: 1, postCode: "PF.PT.001" });
    expect(result).toBeDefined();
  });
});

describe("Dashboard Router", () => {
  it("returns dashboard stats", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.stats();
    expect(result.mainPosts).toBe(27);
    expect(result.optionalPosts).toBe(27);
    expect(result.videos).toBe(8);
    expect(result.academicMinMet).toBe(true);
  });
});

describe("Calendar Notes Router (V2)", () => {
  it("lists calendar notes", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendarNotes.list({});
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Deadline W1");
  });

  it("creates a calendar note (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendarNotes.create({
      date: "2026-04-05",
      title: "Review content",
      type: "todo",
    });
    expect(result).toBeDefined();
  });

  it("toggles a calendar note (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendarNotes.toggle({ id: 1 });
    expect(result).toBeDefined();
  });

  it("deletes a calendar note (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendarNotes.delete({ id: 1 });
    expect(result).toBe(true);
  });
});

describe("Whiteboards Router (V2)", () => {
  it("lists all whiteboards", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.whiteboards.list();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Brainstorm W1");
  });

  it("creates a whiteboard (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.whiteboards.create({ title: "New Board" });
    expect(result).toBeDefined();
  });

  it("gets a single whiteboard", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.whiteboards.get({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.title).toBe("Brainstorm W1");
  });

  it("updates a whiteboard (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.whiteboards.update({ id: 1, title: "Updated Board", data: '{"nodes":[1]}' });
    expect(result).toBeDefined();
  });

  it("deletes a whiteboard (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.whiteboards.delete({ id: 1 });
    expect(result).toBe(true);
  });
});

describe("Copy Templates Router (V2)", () => {
  it("lists all copy templates", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.copyTemplates.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Carousel Template");
  });

  it("creates a copy template (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.copyTemplates.create({
      name: "Video Template",
      structure: "Hook → Story → CTA",
    });
    expect(result).toBeDefined();
  });

  it("deletes a copy template (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.copyTemplates.delete({ id: 1 });
    expect(result).toBe(true);
  });
});

describe("Archive Router (V2)", () => {
  it("lists archived posts", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.archive.list({});
    expect(result).toHaveLength(1);
    expect(result[0].postCode).toBe("AC.W1.001");
  });

  it("archives a post (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.archive.archive({ id: 1, month: "2026-04" });
    expect(result).toBeDefined();
  });

  it("unarchives a post (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.archive.unarchive({ id: 1 });
    expect(result).toBeDefined();
  });
});

describe("Post Copywriting Router (V2)", () => {
  it("updates post copywriting (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.postCopy.update({
      id: 1,
      caption: "Test caption for IELTS post",
      hashtags: "#IELTS #Writing",
      cta: "Save for later!",
    });
    expect(result).toBeDefined();
  });
});

describe("Import/Export Router", () => {
  it("imports excel data (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.importExport.import({ data: "base64data", mode: "preview" });
    expect(result).toBeDefined();
  });

  it("exports excel data (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.importExport.export();
    expect(result.data).toBe("base64data");
  });

  it("imports JSON data (protected)", async () => {
    const ctx = createTestContext(true);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.importExport.importJson({
      lanes: [{ code: "AC", name: "Academic Core" }],
    });
    expect(result.lanes).toBe(1);
  });
});

describe("Activity Log Router", () => {
  it("lists activity log", async () => {
    const ctx = createTestContext(false);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.activity.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
