import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Helper: optional nullable string - accepts string, null, or undefined
const zs = () => z.string().nullable().optional();
const zn = () => z.number().nullable().optional();
const zb = () => z.boolean().nullable().optional();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Taxonomy ───
  lanes: router({
    list: publicProcedure.query(() => db.getAllLanes()),
    create: protectedProcedure.input(z.object({ code: z.string(), name: z.string() })).mutation(({ input }) => db.createLane(input)),
    update: protectedProcedure.input(z.object({ id: z.number(), code: z.string().optional(), name: z.string().optional() })).mutation(({ input }) => db.updateLane(input.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteLane(input.id)),
  }),
  pillars: router({
    list: publicProcedure.query(() => db.getAllPillars()),
    create: protectedProcedure.input(z.object({ code: z.string(), name: z.string() })).mutation(({ input }) => db.createPillar(input)),
    update: protectedProcedure.input(z.object({ id: z.number(), code: z.string().optional(), name: z.string().optional() })).mutation(({ input }) => db.updatePillar(input.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deletePillar(input.id)),
  }),
  series: router({
    list: publicProcedure.query(() => db.getAllSeries()),
    create: protectedProcedure.input(z.object({
      code: z.string(), name: z.string(), laneId: z.number(), pillarId: z.number(),
      purpose: z.string().optional(), typicalFormat: z.string().optional(),
      defaultApproval: z.string().optional(), defaultSourceType: z.string().optional(),
      defaultDifficulty: z.number().optional(),
    })).mutation(({ input }) => db.createSeries(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), code: z.string().optional(), name: z.string().optional(),
      laneId: z.number().optional(), pillarId: z.number().optional(),
      purpose: z.string().optional(), typicalFormat: z.string().optional(),
      defaultApproval: z.string().optional(), defaultSourceType: z.string().optional(),
      defaultDifficulty: z.number().optional(),
    })).mutation(({ input }) => db.updateSeries(input.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteSeries(input.id)),
  }),
  angles: router({
    list: publicProcedure.query(() => db.getAllAngles()),
    create: protectedProcedure.input(z.object({ code: z.string(), name: z.string() })).mutation(({ input }) => db.createAngle(input)),
    update: protectedProcedure.input(z.object({ id: z.number(), code: z.string().optional(), name: z.string().optional() })).mutation(({ input }) => db.updateAngle(input.id, input)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteAngle(input.id)),
  }),

  // ─── Posts ───
  posts: router({
    list: publicProcedure.query(() => db.getAllPosts()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getPostById(input.id)),
    create: protectedProcedure.input(z.object({
      postCode: z.string(), weekLabel: zs(), weekStart: zs(),
      weekEnd: zs(), date: zs(), day: zs(),
      monthLabel: zs(), slotType: zs(),
      countsTowardQuota: zb(), funnelStage: zs(),
      laneCode: zs(), pillarCode: zs(),
      seriesCode: zs(), seriesName: zs(),
      angleCode: zs(), angleName: zs(),
      legacyCode: zs(), topic: zs(),
      objective: zs(), format: zs(),
      sourceBank: zs(), sourceFile: zs(),
      sourceRef: zs(), approvalLevel: zs(),
      difficultyScore: zn(), productionWeight: zn(),
      captionComplexity: zn(), visualComplexity: zn(),
      priority: zs(), status: zs(),
      postingTime: zs(), notes: zs(),
      publishedLink: zs(), metricKey: zs(),
      caption: zs(), hashtags: zs(),
      cta: zs(), copyTemplate: zs(),
      imageUrl: zs(), reviewStatus: zs(), reviewNotes: zs(),
    })).mutation(({ input }) => db.createPost(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      postCode: zs(), weekLabel: zs(),
      weekStart: zs(), weekEnd: zs(),
      date: zs(), day: zs(),
      monthLabel: zs(), slotType: zs(),
      countsTowardQuota: zb(), funnelStage: zs(),
      laneCode: zs(), pillarCode: zs(),
      seriesCode: zs(), seriesName: zs(),
      angleCode: zs(), angleName: zs(),
      legacyCode: zs(), topic: zs(),
      objective: zs(), format: zs(),
      sourceBank: zs(), sourceFile: zs(),
      sourceRef: zs(), approvalLevel: zs(),
      difficultyScore: zn(), productionWeight: zn(),
      captionComplexity: zn(), visualComplexity: zn(),
      priority: zs(), status: zs(),
      postingTime: zs(), notes: zs(),
      publishedLink: zs(), metricKey: zs(),
      caption: zs(), hashtags: zs(),
      cta: zs(), copyTemplate: zs(),
      imageUrl: zs(), reviewStatus: zs(), reviewNotes: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updatePost(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deletePost(input.id)),
    bulkUpdateStatus: protectedProcedure.input(z.object({ ids: z.array(z.number()), status: z.string() })).mutation(({ input }) => db.bulkUpdatePostStatus(input.ids, input.status)),
    bulkDelete: protectedProcedure.input(z.object({ ids: z.array(z.number()) })).mutation(({ input }) => db.bulkDeletePosts(input.ids)),
    search: publicProcedure.input(z.object({ query: z.string() })).query(({ input }) => db.searchPosts(input.query)),
  }),

  // ─── Content Ideas ───
  ideas: router({
    list: publicProcedure.query(() => db.getAllContentIdeas()),
    create: protectedProcedure.input(z.object({
      menuId: z.string(), laneCode: zs(), pillarCode: zs(),
      seriesCode: zs(), seriesName: zs(),
      angleCode: zs(), ideaTitle: zs(),
      description: zs(), topicType: zs(),
      sourceBank: zs(), sourceFile: zs(),
      sourceRef: zs(), approvalLevel: zs(),
      difficultyScore: zn(), easeLabel: zs(),
      executionSpeed: zs(), reusability: zs(),
      suggestedFormat: zs(), readinessStatus: zs(),
      notes: zs(),
    })).mutation(({ input }) => db.createContentIdea(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), menuId: zs(), laneCode: zs(),
      pillarCode: zs(), seriesCode: zs(),
      seriesName: zs(), angleCode: zs(),
      ideaTitle: zs(), description: zs(),
      topicType: zs(), sourceBank: zs(),
      sourceFile: zs(), sourceRef: zs(),
      approvalLevel: zs(), difficultyScore: zn(),
      easeLabel: zs(), executionSpeed: zs(),
      reusability: zs(), suggestedFormat: zs(),
      readinessStatus: zs(), notes: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateContentIdea(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteContentIdea(input.id)),
    promote: protectedProcedure.input(z.object({
      ideaId: z.number(), postCode: z.string(), weekLabel: z.string().optional(),
      date: z.string().optional(), day: z.string().optional(),
    })).mutation(async ({ input }) => {
      const ideas = await db.getAllContentIdeas();
      const idea = ideas.find(i => i.id === input.ideaId);
      if (!idea) throw new Error("Idea not found");
      const post = await db.createPost({
        postCode: input.postCode,
        weekLabel: input.weekLabel || '',
        date: input.date || '',
        day: input.day || '',
        laneCode: idea.laneCode,
        pillarCode: idea.pillarCode,
        seriesCode: idea.seriesCode,
        seriesName: idea.seriesName,
        angleCode: idea.angleCode,
        topic: idea.ideaTitle,
        objective: idea.description,
        format: idea.suggestedFormat || '',
        sourceBank: idea.sourceBank,
        sourceFile: idea.sourceFile,
        sourceRef: idea.sourceRef,
        approvalLevel: idea.approvalLevel || '',
        difficultyScore: idea.difficultyScore || 2,
        status: 'Planned',
        priority: 'Core',
        slotType: 'Main',
      });
      await db.updateContentIdea(input.ideaId, { readinessStatus: 'Promoted' });
      return post;
    }),
  }),

  // ─── Optional Posts ───
  optional: router({
    list: publicProcedure.query(() => db.getAllOptionalPosts()),
    create: protectedProcedure.input(z.object({
      postCode: z.string(), weekLabel: zs(), funnelStage: zs(),
      laneCode: zs(), pillarCode: zs(),
      seriesCode: zs(), angleCode: zs(),
      topic: zs(), format: zs(),
      sourceBank: zs(), approvalLevel: zs(),
      difficultyScore: zn(), executionSpeed: zs(),
      whyEasy: zs(), whenToUse: zs(),
      notes: zs(),
    })).mutation(({ input }) => db.createOptionalPost(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), postCode: zs(), weekLabel: zs(),
      funnelStage: zs(), laneCode: zs(),
      pillarCode: zs(), seriesCode: zs(),
      angleCode: zs(), topic: zs(),
      format: zs(), sourceBank: zs(),
      approvalLevel: zs(), difficultyScore: zn(),
      executionSpeed: zs(), whyEasy: zs(),
      whenToUse: zs(), notes: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateOptionalPost(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteOptionalPost(input.id)),
    activate: protectedProcedure.input(z.object({
      optionalId: z.number(), weekLabel: z.string().optional(), date: z.string().optional(),
    })).mutation(async ({ input }) => {
      const items = await db.getAllOptionalPosts();
      const item = items.find(i => i.id === input.optionalId);
      if (!item) throw new Error("Optional post not found");
      const post = await db.createPost({
        postCode: item.postCode + '.ACT',
        weekLabel: input.weekLabel || item.weekLabel || '',
        date: input.date || '',
        laneCode: item.laneCode,
        pillarCode: item.pillarCode,
        seriesCode: item.seriesCode,
        angleCode: item.angleCode,
        topic: item.topic,
        format: item.format,
        sourceBank: item.sourceBank,
        approvalLevel: item.approvalLevel,
        difficultyScore: item.difficultyScore || 2,
        funnelStage: item.funnelStage,
        status: 'Planned',
        priority: 'Core',
        slotType: 'Main',
      });
      await db.deleteOptionalPost(input.optionalId);
      return post;
    }),
  }),

  // ─── Videos ───
  videos: router({
    list: publicProcedure.query(() => db.getAllVideos()),
    create: protectedProcedure.input(z.object({
      videoId: z.string(), weekLabel: zs(), videoType: zs(),
      existingOrNew: zs(), topic: zs(),
      objective: zs(), laneCode: zs(),
      pillarCode: zs(), seriesCode: zs(),
      sourceAsset: zs(), hook: zs(),
      visualStyle: zs(), format: zs(),
      duration: zs(), productionStage: zs(),
      status: zs(), publishedLink: zs(),
      notes: zs(), script: zs(),
    })).mutation(({ input }) => db.createVideo(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), videoId: zs(), weekLabel: zs(),
      videoType: zs(), existingOrNew: zs(),
      topic: zs(), objective: zs(),
      laneCode: zs(), pillarCode: zs(),
      seriesCode: zs(), sourceAsset: zs(),
      hook: zs(), visualStyle: zs(),
      format: zs(), duration: zs(),
      productionStage: zs(), status: zs(),
      publishedLink: zs(), notes: zs(),
      script: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateVideo(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteVideo(input.id)),
  }),

  // ─── Metrics ───
  metrics: router({
    list: publicProcedure.query(() => db.getAllMetrics()),
    create: protectedProcedure.input(z.object({
      postId: zn(), postCode: zs(),
      datePosted: zs(), weekLabel: zs(),
      topic: zs(), format: zs(),
      link: zs(), reach: zn(),
      views: zn(), reactions: zn(),
      comments: zn(), shares: zn(),
      saves: zn(), clicks: zn(),
      inboxDm: zn(), leads: zn(),
      notes: zs(),
    })).mutation(({ input }) => db.createMetric(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), postId: zn(), postCode: zs(),
      datePosted: zs(), weekLabel: zs(),
      topic: zs(), format: zs(),
      link: zs(), reach: zn(),
      views: zn(), reactions: zn(),
      comments: zn(), shares: zn(),
      saves: zn(), clicks: zn(),
      inboxDm: zn(), leads: zn(),
      notes: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateMetric(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteMetric(input.id)),
  }),

  // ─── Backlog ───
  backlog: router({
    list: publicProcedure.query(() => db.getAllBacklog()),
    create: protectedProcedure.input(z.object({
      legacyCode: zs(), proposedCode: zs(),
      topic: zs(), oldStatus: zs(),
      newStatus: zs(), laneCode: zs(),
      pillarCode: zs(), seriesCode: zs(),
      source: zs(), difficulty: zn(),
      approvalNeed: zs(), whyKeep: zs(),
      suggestedWeek: zs(), notes: zs(),
    })).mutation(({ input }) => db.createBacklogItem(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), legacyCode: zs(), proposedCode: zs(),
      topic: zs(), oldStatus: zs(),
      newStatus: zs(), laneCode: zs(),
      pillarCode: zs(), seriesCode: zs(),
      source: zs(), difficulty: zn(),
      approvalNeed: zs(), whyKeep: zs(),
      suggestedWeek: zs(), notes: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateBacklogItem(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteBacklogItem(input.id)),
    revive: protectedProcedure.input(z.object({
      backlogId: z.number(), postCode: z.string(), weekLabel: z.string().optional(),
      date: z.string().optional(),
    })).mutation(async ({ input }) => {
      const items = await db.getAllBacklog();
      const item = items.find(i => i.id === input.backlogId);
      if (!item) throw new Error("Backlog item not found");
      const post = await db.createPost({
        postCode: input.postCode,
        weekLabel: input.weekLabel || '',
        date: input.date || '',
        laneCode: item.laneCode,
        pillarCode: item.pillarCode,
        seriesCode: item.seriesCode,
        topic: item.topic,
        approvalLevel: item.approvalNeed || '',
        difficultyScore: item.difficulty || 2,
        status: 'Planned',
        priority: 'Core',
        slotType: 'Main',
        source: item.source,
      });
      await db.deleteBacklogItem(input.backlogId);
      return post;
    }),
  }),

  // ─── Dashboard ───
  dashboard: router({
    stats: publicProcedure.input(z.object({ weekLabel: z.string().optional() }).optional()).query(({ input }) =>
      db.getDashboardStats(input?.weekLabel)
    ),
  }),

  // ─── Activity Log ───
  activity: router({
    list: publicProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(({ input }) =>
      db.getActivityLog(input?.limit || 50)
    ),
  }),

  // ─── V2: Calendar Notes ───
  calendarNotes: router({
    list: publicProcedure.input(z.object({ month: z.string().optional() }).optional()).query(({ input }) =>
      db.getCalendarNotes(input?.month)
    ),
    create: protectedProcedure.input(z.object({
      date: z.string(), title: z.string(), description: zs(),
      noteType: zs(), startTime: zs(),
      endTime: zs(), color: zs(),
    })).mutation(({ input }) => db.createCalendarNote(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), date: zs(), title: zs(),
      description: zs(), noteType: zs(),
      startTime: zs(), endTime: zs(),
      color: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateCalendarNote(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCalendarNote(input.id)),
    toggle: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.toggleCalendarNote(input.id)),
  }),

  // ─── V2: Whiteboards ───
  whiteboards: router({
    list: publicProcedure.query(() => db.getAllWhiteboards()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getWhiteboard(input.id)),
    create: protectedProcedure.input(z.object({
      title: z.string(), data: z.string().optional(),
    })).mutation(({ input }) => db.createWhiteboard(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), title: z.string().optional(), data: z.string().optional(), thumbnail: z.string().optional(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateWhiteboard(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteWhiteboard(input.id)),
  }),

  // ─── V2: Copy Templates ───
  copyTemplates: router({
    list: publicProcedure.query(() => db.getAllCopyTemplates()),
    create: protectedProcedure.input(z.object({
      name: z.string(), category: zs(),
      captionTemplate: zs(), hashtagTemplate: zs(),
      ctaTemplate: zs(), structure: zs(),
    })).mutation(({ input }) => db.createCopyTemplate(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: zs(), category: zs(),
      captionTemplate: zs(), hashtagTemplate: zs(),
      ctaTemplate: zs(), structure: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateCopyTemplate(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCopyTemplate(input.id)),
  }),

  // ─── V2: Archive ───
  archive: router({
    list: publicProcedure.input(z.object({ month: z.string().optional() }).optional()).query(({ input }) =>
      db.getArchivedPosts(input?.month)
    ),
    archive: protectedProcedure.input(z.object({ id: z.number(), month: z.string() })).mutation(({ input }) =>
      db.archivePost(input.id, input.month)
    ),
    unarchive: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      db.unarchivePost(input.id)
    ),
  }),

  // ─── V2: Post Copywriting ───
  postCopy: router({
    update: protectedProcedure.input(z.object({
      id: z.number(), caption: zs(), hashtags: zs(),
      cta: zs(), copyTemplate: zs(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updatePostCopywriting(id, data); }),
  }),

  // ─── V3: Todos ───
  todos: router({
    list: publicProcedure.query(() => db.getAllTodos()),
    create: protectedProcedure.input(z.object({
      title: z.string(), description: zs(),
      priority: zs(), dueDate: zs(),
      calendarNoteId: zn(), postId: zn(),
      category: zs(), sortOrder: zn(),
    })).mutation(({ input }) => db.createTodo(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(), title: zs(), description: zs(),
      completed: zb(), priority: zs(), dueDate: zs(),
      calendarNoteId: zn(), postId: zn(),
      category: zs(), sortOrder: zn(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateTodo(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteTodo(input.id)),
    toggle: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const all = await db.getAllTodos();
      const todo = all.find(t => t.id === input.id);
      if (!todo) throw new Error('Todo not found');
      return db.updateTodo(input.id, { completed: !todo.completed });
    }),
  }),

  // ─── V3: Post Review ───
  review: router({
    list: publicProcedure.query(() => db.getPostsForReview()),
    submit: protectedProcedure.input(z.object({ id: z.number(), reviewNotes: zs() })).mutation(({ input }) =>
      db.updatePostReview(input.id, 'pending', input.reviewNotes)
    ),
    approve: protectedProcedure.input(z.object({ id: z.number(), reviewNotes: zs() })).mutation(({ input }) =>
      db.updatePostReview(input.id, 'approved', input.reviewNotes)
    ),
    reject: protectedProcedure.input(z.object({ id: z.number(), reviewNotes: zs() })).mutation(({ input }) =>
      db.updatePostReview(input.id, 'rejected', input.reviewNotes)
    ),
  }),

  // ─── Import/Export ───
  importExport: router({
    import: protectedProcedure.input(z.object({
      data: z.string(),
      mode: z.enum(['preview', 'import']),
    })).mutation(async ({ input }) => {
      return db.importExcel(input.data, input.mode);
    }),
    export: protectedProcedure.mutation(async () => {
      return db.exportExcel();
    }),
    exportCsv: protectedProcedure.input(z.object({
      table: z.enum(['posts', 'contentIdeas', 'optionalPosts', 'videos', 'backlog', 'metrics', 'lanes', 'pillars', 'series', 'angles']),
    })).mutation(async ({ input }) => {
      return db.exportCsv(input.table);
    }),
    importJson: protectedProcedure.input(z.object({
      lanes: z.array(z.any()).optional(),
      pillars: z.array(z.any()).optional(),
      series: z.array(z.any()).optional(),
      angles: z.array(z.any()).optional(),
      posts: z.array(z.any()).optional(),
      contentIdeas: z.array(z.any()).optional(),
      optionalPosts: z.array(z.any()).optional(),
      videos: z.array(z.any()).optional(),
      backlog: z.array(z.any()).optional(),
    })).mutation(async ({ input }) => {
      const results: Record<string, any> = {};
      if (input.lanes?.length) { await db.bulkInsertLanes(input.lanes); results.lanes = input.lanes.length; }
      if (input.pillars?.length) { await db.bulkInsertPillars(input.pillars); results.pillars = input.pillars.length; }
      if (input.angles?.length) { await db.bulkInsertAngles(input.angles); results.angles = input.angles.length; }
      if (input.series?.length) { await db.bulkInsertSeries(input.series); results.series = input.series.length; }
      if (input.posts?.length) { results.posts = await db.bulkInsertPosts(input.posts); }
      if (input.contentIdeas?.length) { results.contentIdeas = await db.bulkInsertContentIdeas(input.contentIdeas); }
      if (input.optionalPosts?.length) { results.optionalPosts = await db.bulkInsertOptionalPosts(input.optionalPosts); }
      if (input.videos?.length) { results.videos = await db.bulkInsertVideos(input.videos); }
      if (input.backlog?.length) { results.backlog = await db.bulkInsertBacklog(input.backlog); }
      return results;
    }),
  }),
});

export type AppRouter = typeof appRouter;
