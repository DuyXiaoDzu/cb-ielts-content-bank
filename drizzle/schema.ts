import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Lanes (6 types: DG, TC, AC, MT, SR, AD) ───
export const lanes = mysqlTable("lanes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Lane = typeof lanes.$inferSelect;

// ─── Pillars (5 types: AS, BT, PF, LR, SS) ───
export const pillars = mysqlTable("pillars", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Pillar = typeof pillars.$inferSelect;

// ─── Series (47 types with lane/pillar relationships) ───
export const series = mysqlTable("series", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  laneId: int("laneId").notNull(),
  pillarId: int("pillarId").notNull(),
  purpose: text("purpose"),
  typicalFormat: varchar("typicalFormat", { length: 100 }),
  defaultApproval: varchar("defaultApproval", { length: 100 }),
  defaultSourceType: varchar("defaultSourceType", { length: 100 }),
  defaultDifficulty: int("defaultDifficulty"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Series = typeof series.$inferSelect;

// ─── Angles ───
export const angles = mysqlTable("angles", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Angle = typeof angles.$inferSelect;

// ─── Posts (core table) ───
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  postCode: varchar("postCode", { length: 30 }).notNull().unique(),
  weekLabel: varchar("weekLabel", { length: 30 }),
  weekStart: varchar("weekStart", { length: 20 }),
  weekEnd: varchar("weekEnd", { length: 20 }),
  date: varchar("date", { length: 20 }),
  day: varchar("day", { length: 10 }),
  monthLabel: varchar("monthLabel", { length: 30 }),
  slotType: varchar("slotType", { length: 20 }).default("Main"),
  countsTowardQuota: boolean("countsTowardQuota").default(true),
  funnelStage: varchar("funnelStage", { length: 50 }),
  laneCode: varchar("laneCode", { length: 10 }),
  pillarCode: varchar("pillarCode", { length: 10 }),
  seriesCode: varchar("seriesCode", { length: 20 }),
  seriesName: varchar("seriesName", { length: 200 }),
  angleCode: varchar("angleCode", { length: 20 }),
  angleName: varchar("angleName", { length: 200 }),
  legacyCode: varchar("legacyCode", { length: 30 }),
  topic: text("topic"),
  objective: text("objective"),
  format: varchar("format", { length: 100 }),
  sourceBank: varchar("sourceBank", { length: 200 }),
  sourceFile: varchar("sourceFile", { length: 500 }),
  sourceRef: text("sourceRef"),
  approvalLevel: varchar("approvalLevel", { length: 50 }),
  difficultyScore: int("difficultyScore"),
  productionWeight: int("productionWeight"),
  captionComplexity: int("captionComplexity"),
  visualComplexity: int("visualComplexity"),
  priority: varchar("priority", { length: 20 }).default("Core"),
  status: varchar("status", { length: 30 }).default("Planned"),
  postingTime: varchar("postingTime", { length: 20 }),
  notes: text("notes"),
  publishedLink: text("publishedLink"),
  metricKey: varchar("metricKey", { length: 50 }),
  // V2: Copywriting fields
  caption: text("caption"),
  hashtags: text("hashtags"),
  cta: text("cta"),
  copyTemplate: varchar("copyTemplate", { length: 50 }),
  // V2: Archive
  archived: boolean("archived").default(false),
  archivedMonth: varchar("archivedMonth", { length: 10 }),
  // V3: Image and review
  imageUrl: text("imageUrl"),
  reviewStatus: varchar("reviewStatus", { length: 30 }).default("draft"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Post = typeof posts.$inferSelect;

// ─── Content Ideas (Content Bank Menu) ───
export const contentIdeas = mysqlTable("content_ideas", {
  id: int("id").autoincrement().primaryKey(),
  menuId: varchar("menuId", { length: 20 }).notNull().unique(),
  laneCode: varchar("laneCode", { length: 10 }),
  pillarCode: varchar("pillarCode", { length: 10 }),
  seriesCode: varchar("seriesCode", { length: 20 }),
  seriesName: varchar("seriesName", { length: 200 }),
  angleCode: varchar("angleCode", { length: 20 }),
  ideaTitle: text("ideaTitle"),
  description: text("description"),
  topicType: varchar("topicType", { length: 50 }),
  sourceBank: varchar("sourceBank", { length: 200 }),
  sourceFile: varchar("sourceFile", { length: 500 }),
  sourceRef: text("sourceRef"),
  approvalLevel: varchar("approvalLevel", { length: 50 }),
  difficultyScore: int("difficultyScore"),
  easeLabel: varchar("easeLabel", { length: 30 }),
  executionSpeed: varchar("executionSpeed", { length: 30 }),
  reusability: varchar("reusability", { length: 30 }),
  suggestedFormat: varchar("suggestedFormat", { length: 100 }),
  readinessStatus: varchar("readinessStatus", { length: 30 }).default("New"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ContentIdea = typeof contentIdeas.$inferSelect;

// ─── Optional Posts (Optional Pool) ───
export const optionalPosts = mysqlTable("optional_posts", {
  id: int("id").autoincrement().primaryKey(),
  weekLabel: varchar("weekLabel", { length: 30 }),
  funnelStage: varchar("funnelStage", { length: 50 }),
  laneCode: varchar("laneCode", { length: 10 }),
  pillarCode: varchar("pillarCode", { length: 10 }),
  seriesCode: varchar("seriesCode", { length: 20 }),
  angleCode: varchar("angleCode", { length: 20 }),
  postCode: varchar("postCode", { length: 30 }).notNull().unique(),
  topic: text("topic"),
  format: varchar("format", { length: 100 }),
  sourceBank: varchar("sourceBank", { length: 200 }),
  approvalLevel: varchar("approvalLevel", { length: 50 }),
  difficultyScore: int("difficultyScore"),
  executionSpeed: varchar("executionSpeed", { length: 30 }),
  whyEasy: text("whyEasy"),
  whenToUse: text("whenToUse"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OptionalPost = typeof optionalPosts.$inferSelect;

// ─── Videos (Video Pipeline) ───
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  videoId: varchar("videoId", { length: 30 }).notNull().unique(),
  weekLabel: varchar("weekLabel", { length: 30 }),
  videoType: varchar("videoType", { length: 50 }),
  existingOrNew: varchar("existingOrNew", { length: 20 }),
  topic: text("topic"),
  objective: text("objective"),
  laneCode: varchar("laneCode", { length: 10 }),
  pillarCode: varchar("pillarCode", { length: 10 }),
  seriesCode: varchar("seriesCode", { length: 20 }),
  sourceAsset: varchar("sourceAsset", { length: 500 }),
  hook: text("hook"),
  visualStyle: text("visualStyle"),
  format: varchar("format", { length: 100 }),
  duration: varchar("duration", { length: 30 }),
  productionStage: varchar("productionStage", { length: 30 }).default("Concept"),
  status: varchar("status", { length: 30 }).default("Not Started"),
  publishedLink: text("publishedLink"),
  notes: text("notes"),
  script: text("script"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Video = typeof videos.$inferSelect;

// ─── Metrics (linked to posts) ───
export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId"),
  postCode: varchar("postCode", { length: 30 }),
  datePosted: varchar("datePosted", { length: 20 }),
  weekLabel: varchar("weekLabel", { length: 30 }),
  topic: varchar("topic", { length: 500 }),
  format: varchar("format", { length: 100 }),
  link: text("link"),
  reach: int("reach").default(0),
  views: int("views").default(0),
  reactions: int("reactions").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  saves: int("saves").default(0),
  clicks: int("clicks").default(0),
  inboxDm: int("inboxDm").default(0),
  leads: int("leads").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Metric = typeof metrics.$inferSelect;

// ─── Backlog (Backlog and Carryover) ───
export const backlog = mysqlTable("backlog", {
  id: int("id").autoincrement().primaryKey(),
  legacyCode: varchar("legacyCode", { length: 30 }),
  proposedCode: varchar("proposedCode", { length: 30 }),
  topic: text("topic"),
  oldStatus: varchar("oldStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }),
  laneCode: varchar("laneCode", { length: 10 }),
  pillarCode: varchar("pillarCode", { length: 10 }),
  seriesCode: varchar("seriesCode", { length: 20 }),
  source: varchar("source", { length: 200 }),
  difficulty: int("difficulty"),
  approvalNeed: varchar("approvalNeed", { length: 50 }),
  whyKeep: text("whyKeep"),
  suggestedWeek: varchar("suggestedWeek", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Backlog = typeof backlog.$inferSelect;

// ─── Activity Log ───
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityLogEntry = typeof activityLog.$inferSelect;

// ─── V2: Calendar Notes (Google Calendar-like) ───
export const calendarNotes = mysqlTable("calendar_notes", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 20 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  noteType: varchar("noteType", { length: 30 }).default("note"),
  completed: boolean("completed").default(false),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CalendarNote = typeof calendarNotes.$inferSelect;

// ─── V2: Whiteboard ───
export const whiteboards = mysqlTable("whiteboards", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  data: text("data"),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Whiteboard = typeof whiteboards.$inferSelect;

// ─── V2: Copywriting Templates ───
export const copyTemplates = mysqlTable("copy_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }),
  captionTemplate: text("captionTemplate"),
  hashtagTemplate: text("hashtagTemplate"),
  ctaTemplate: text("ctaTemplate"),
  structure: text("structure"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CopyTemplate = typeof copyTemplates.$inferSelect;

// ─── V3: Todo List ───
export const todos = mysqlTable("todos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  priority: varchar("priority", { length: 20 }).default("medium"),
  dueDate: varchar("dueDate", { length: 20 }),
  calendarNoteId: int("calendarNoteId"),
  postId: int("postId"),
  category: varchar("category", { length: 50 }),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Todo = typeof todos.$inferSelect;
