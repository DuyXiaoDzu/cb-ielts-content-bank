import { eq, desc, sql, like, and, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  lanes, pillars, series, angles,
  posts, contentIdeas, optionalPosts, videos, metrics, backlog, activityLog,
  calendarNotes, whiteboards, copyTemplates, todos,
  type Lane, type Pillar, type Series, type Angle,
  type Post, type ContentIdea, type OptionalPost, type Video, type Metric, type Backlog,
  type CalendarNote, type Whiteboard, type CopyTemplate, type Todo
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Lanes ───
export async function getAllLanes() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(lanes).orderBy(lanes.code);
}
export async function createLane(data: { code: string; name: string }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(lanes).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateLane(id: number, data: Partial<{ code: string; name: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(lanes).set(data).where(eq(lanes.id, id));
}
export async function deleteLane(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(lanes).where(eq(lanes.id, id));
}

// ─── Pillars ───
export async function getAllPillars() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(pillars).orderBy(pillars.code);
}
export async function createPillar(data: { code: string; name: string }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(pillars).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function updatePillar(id: number, data: Partial<{ code: string; name: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(pillars).set(data).where(eq(pillars.id, id));
}
export async function deletePillar(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(pillars).where(eq(pillars.id, id));
}

// ─── Series ───
export async function getAllSeries() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(series).orderBy(series.code);
}
export async function createSeries(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(series).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateSeries(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(series).set(data).where(eq(series.id, id));
}
export async function deleteSeries(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(series).where(eq(series.id, id));
}

// ─── Angles ───
export async function getAllAngles() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(angles).orderBy(angles.code);
}
export async function createAngle(data: { code: string; name: string }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(angles).values(data);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateAngle(id: number, data: Partial<{ code: string; name: string }>) {
  const db = await getDb(); if (!db) return;
  await db.update(angles).set(data).where(eq(angles.id, id));
}
export async function deleteAngle(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(angles).where(eq(angles.id, id));
}

// ─── Posts ───
export async function getAllPosts() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(posts).orderBy(desc(posts.id));
}
export async function getPostById(id: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0] || null;
}
// Sanitize input: convert empty strings to null, strip undefined keys
function sanitize(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    cleaned[k] = v === '' ? null : v;
  }
  return cleaned;
}

export async function createPost(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(posts).values(sanitize(data) as any);
  return { id: Number(result[0].insertId), ...data };
}
export async function updatePost(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(posts).set(sanitize(data)).where(eq(posts.id, id));
}
export async function deletePost(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(posts).where(eq(posts.id, id));
}
export async function bulkUpdatePostStatus(ids: number[], status: string) {
  const db = await getDb(); if (!db) return;
  await db.update(posts).set({ status }).where(inArray(posts.id, ids));
}
export async function bulkDeletePosts(ids: number[]) {
  const db = await getDb(); if (!db) return;
  await db.delete(posts).where(inArray(posts.id, ids));
}

// ─── Content Ideas ───
export async function getAllContentIdeas() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contentIdeas).orderBy(contentIdeas.menuId);
}
export async function createContentIdea(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(contentIdeas).values(sanitize(data) as any);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateContentIdea(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(contentIdeas).set(sanitize(data)).where(eq(contentIdeas.id, id));
}
export async function deleteContentIdea(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(contentIdeas).where(eq(contentIdeas.id, id));
}

// ─── Optional Posts ───
export async function getAllOptionalPosts() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(optionalPosts).orderBy(optionalPosts.postCode);
}
export async function createOptionalPost(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(optionalPosts).values(sanitize(data) as any);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateOptionalPost(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(optionalPosts).set(sanitize(data)).where(eq(optionalPosts.id, id));
}
export async function deleteOptionalPost(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(optionalPosts).where(eq(optionalPosts.id, id));
}

// ─── Videos ───
export async function getAllVideos() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(videos).orderBy(videos.videoId);
}
export async function createVideo(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(videos).values(sanitize(data) as any);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateVideo(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(videos).set(sanitize(data)).where(eq(videos.id, id));
}
export async function deleteVideo(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(videos).where(eq(videos.id, id));
}

// ─── Metrics ───
export async function getAllMetrics() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(metrics).orderBy(desc(metrics.id));
}
export async function createMetric(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(metrics).values(sanitize(data) as any);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateMetric(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(metrics).set(sanitize(data)).where(eq(metrics.id, id));
}
export async function deleteMetric(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(metrics).where(eq(metrics.id, id));
}

// ─── Backlog ───
export async function getAllBacklog() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(backlog).orderBy(desc(backlog.id));
}
export async function createBacklogItem(data: any) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(backlog).values(sanitize(data) as any);
  return { id: Number(result[0].insertId), ...data };
}
export async function updateBacklogItem(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(backlog).set(sanitize(data)).where(eq(backlog.id, id));
}
export async function deleteBacklogItem(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(backlog).where(eq(backlog.id, id));
}

// ─── Activity Log ───
export async function logActivity(data: { userId?: number; action: string; entityType?: string; entityId?: number; details?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(activityLog).values(data);
}
export async function getActivityLog(limit = 50) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(activityLog).orderBy(desc(activityLog.id)).limit(limit);
}

// ─── Dashboard aggregation ───
export async function getDashboardStats(weekLabel?: string) {
  const db = await getDb(); if (!db) return null;
  const allPosts = await db.select().from(posts);
  const allOptional = await db.select().from(optionalPosts);
  const allVideos = await db.select().from(videos);

  // If weekLabel specified, filter; otherwise use all
  const weekPosts = weekLabel ? allPosts.filter(p => p.weekLabel === weekLabel) : allPosts;
  const weekOptional = weekLabel ? allOptional.filter(p => p.weekLabel === weekLabel) : allOptional;
  const weekVideos = weekLabel ? allVideos.filter(v => v.weekLabel === weekLabel) : allVideos;

  const mainPosts = weekPosts.filter(p => p.slotType === 'Main');
  const avgDifficulty = mainPosts.length > 0
    ? mainPosts.reduce((sum, p) => sum + (p.difficultyScore || 0), 0) / mainPosts.length
    : 0;

  // Approval burden: Expert=3, Leader=2, Light=1, None=0
  const approvalWeights: Record<string, number> = {
    'Expert Review': 3, 'Leader Review': 2, 'Light Check': 1, 'No Expert Review': 0
  };
  const approvalBurden = weekPosts.reduce((sum, p) =>
    sum + (approvalWeights[p.approvalLevel || ''] || 0), 0);

  // Lane mix
  const laneMix: Record<string, number> = {};
  weekPosts.forEach(p => {
    if (p.laneCode) laneMix[p.laneCode] = (laneMix[p.laneCode] || 0) + 1;
  });

  // Academic minimum: at least 1 AC lane post
  const academicMinimum = weekPosts.some(p => p.laneCode === 'AC');

  // Upcoming posts (next 5 by date)
  const today = new Date().toISOString().split('T')[0];
  const upcoming = allPosts
    .filter(p => p.date && p.date >= today && p.status !== 'Published' && p.status !== 'Cancelled')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 5);

  // Available week labels
  const weekLabels = Array.from(new Set(allPosts.map(p => p.weekLabel).filter(Boolean))).sort();

  return {
    mainPostsCount: mainPosts.length,
    optionalPostsCount: weekOptional.length,
    videoCount: weekVideos.length,
    avgDifficulty: Math.round(avgDifficulty * 100) / 100,
    approvalBurden,
    laneMix,
    academicMinimum,
    upcoming,
    weekLabels,
    totalPosts: allPosts.length,
    totalIdeas: (await db.select().from(contentIdeas)).length,
  };
}

// ─── Bulk import helpers ───
export async function bulkInsertLanes(data: { code: string; name: string }[]) {
  const db = await getDb(); if (!db) return;
  for (const item of data) {
    await db.insert(lanes).values(item).onDuplicateKeyUpdate({ set: { name: item.name } });
  }
}
export async function bulkInsertPillars(data: { code: string; name: string }[]) {
  const db = await getDb(); if (!db) return;
  for (const item of data) {
    await db.insert(pillars).values(item).onDuplicateKeyUpdate({ set: { name: item.name } });
  }
}
export async function bulkInsertSeries(data: any[]) {
  const db = await getDb(); if (!db) return;
  for (const item of data) {
    await db.insert(series).values(item).onDuplicateKeyUpdate({
      set: { name: item.name, laneId: item.laneId, pillarId: item.pillarId, purpose: item.purpose,
        typicalFormat: item.typicalFormat, defaultApproval: item.defaultApproval,
        defaultSourceType: item.defaultSourceType, defaultDifficulty: item.defaultDifficulty }
    });
  }
}
export async function bulkInsertPosts(data: any[]) {
  const db = await getDb(); if (!db) return { imported: 0, skipped: 0 };
  let imported = 0, skipped = 0;
  for (const item of data) {
    try {
      await db.insert(posts).values(item).onDuplicateKeyUpdate({ set: item });
      imported++;
    } catch { skipped++; }
  }
  return { imported, skipped };
}
export async function bulkInsertContentIdeas(data: any[]) {
  const db = await getDb(); if (!db) return { imported: 0, skipped: 0 };
  let imported = 0, skipped = 0;
  for (const item of data) {
    try {
      await db.insert(contentIdeas).values(item).onDuplicateKeyUpdate({ set: item });
      imported++;
    } catch { skipped++; }
  }
  return { imported, skipped };
}
export async function bulkInsertOptionalPosts(data: any[]) {
  const db = await getDb(); if (!db) return { imported: 0, skipped: 0 };
  let imported = 0, skipped = 0;
  for (const item of data) {
    try {
      await db.insert(optionalPosts).values(item).onDuplicateKeyUpdate({ set: item });
      imported++;
    } catch { skipped++; }
  }
  return { imported, skipped };
}
export async function bulkInsertVideos(data: any[]) {
  const db = await getDb(); if (!db) return { imported: 0, skipped: 0 };
  let imported = 0, skipped = 0;
  for (const item of data) {
    try {
      await db.insert(videos).values(item).onDuplicateKeyUpdate({ set: item });
      imported++;
    } catch { skipped++; }
  }
  return { imported, skipped };
}
export async function bulkInsertBacklog(data: any[]) {
  const db = await getDb(); if (!db) return { imported: 0, skipped: 0 };
  let imported = 0, skipped = 0;
  for (const item of data) {
    try {
      await db.insert(backlog).values(item);
      imported++;
    } catch { skipped++; }
  }
  return { imported, skipped };
}
export async function bulkInsertAngles(data: { code: string; name: string }[]) {
  const db = await getDb(); if (!db) return;
  for (const item of data) {
    await db.insert(angles).values(item).onDuplicateKeyUpdate({ set: { name: item.name } });
  }
}

// ─── Search ───
export async function searchPosts(query: string) {
  const db = await getDb(); if (!db) return [];
  const q = `%${query}%`;
  return db.select().from(posts).where(
    or(like(posts.postCode, q), like(posts.topic, q), like(posts.seriesCode, q))
  ).limit(50);
}

// ─── Import/Export Excel ───
import * as XLSX from 'xlsx';

export async function importExcel(base64Data: string, mode: 'preview' | 'import') {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const buffer = Buffer.from(base64Data, 'base64');
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheetMapping: Record<string, string> = {
    'Code Guideline': 'lanes',
    'Post Detail DB': 'posts',
    'Content Bank Menu': 'contentIdeas',
    'Optional Pool': 'optionalPosts',
    'Video Pipeline': 'videos',
    'Backlog': 'backlog',
  };

  const result: Record<string, any> = { sheets: {} };

  for (const sheetName of workbook.SheetNames) {
    const target = sheetMapping[sheetName];
    if (!target) continue;

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (mode === 'preview') {
      // Duplicate detection: check existing records in DB
      let duplicates = 0;
      let newCount = rows.length;
      try {
        if (target === 'posts') {
          const existing = await db.select({ postCode: posts.postCode }).from(posts);
          const existingCodes = new Set(existing.map((e: any) => e.postCode));
          rows.forEach((r: any) => {
            const code = String(r['Post Code'] || r['postCode'] || r['Code'] || '');
            if (code && existingCodes.has(code)) duplicates++;
          });
        } else if (target === 'contentIdeas') {
          const existing = await db.select({ menuId: contentIdeas.menuId }).from(contentIdeas);
          const existingIds = new Set(existing.map((e: any) => e.menuId));
          rows.forEach((r: any) => {
            const id = String(r['Menu ID'] || r['ID'] || r['menuId'] || '');
            if (id && existingIds.has(id)) duplicates++;
          });
        } else if (target === 'optionalPosts') {
          const existing = await db.select({ postCode: optionalPosts.postCode }).from(optionalPosts);
          const existingCodes = new Set(existing.map((e: any) => e.postCode));
          rows.forEach((r: any) => {
            const code = String(r['Post Code'] || r['Code'] || r['postCode'] || '');
            if (code && existingCodes.has(code)) duplicates++;
          });
        } else if (target === 'videos') {
          const existing = await db.select({ videoId: videos.videoId }).from(videos);
          const existingIds = new Set(existing.map((e: any) => e.videoId));
          rows.forEach((r: any) => {
            const id = String(r['Video ID'] || r['ID'] || r['videoId'] || '');
            if (id && existingIds.has(id)) duplicates++;
          });
        } else if (target === 'backlog') {
          const existing = await db.select({ legacyCode: backlog.legacyCode }).from(backlog);
          const existingCodes = new Set(existing.map((e: any) => e.legacyCode));
          rows.forEach((r: any) => {
            const code = String(r['Legacy Code'] || r['Code'] || r['legacyCode'] || '');
            if (code && existingCodes.has(code)) duplicates++;
          });
        } else if (target === 'lanes') {
          const existing = await db.select({ code: lanes.code }).from(lanes);
          const existingCodes = new Set(existing.map((e: any) => e.code));
          rows.forEach((r: any) => {
            const code = String(r['Lane Code'] || r['Code'] || r['code'] || '');
            if (code && existingCodes.has(code)) duplicates++;
          });
        }
        newCount = rows.length - duplicates;
      } catch (e) { /* ignore detection errors */ }
      result.sheets[sheetName] = { total: rows.length, new: newCount, duplicates };
    } else {
      // Import mode
      try {
        let imported = 0;
        let skipped = 0;

        if (target === 'lanes') {
          const mapped = rows.map(r => ({ code: String(r['Lane Code'] || r['Code'] || r['code'] || ''), name: String(r['Lane Name'] || r['Name'] || r['name'] || '') })).filter(r => r.code);
          if (mapped.length) { await bulkInsertLanes(mapped); imported = mapped.length; }
        } else if (target === 'posts') {
          const mapped = rows.map(r => ({
            postCode: String(r['Post Code'] || r['postCode'] || r['Code'] || ''),
            weekLabel: String(r['Week Label'] || r['Week'] || r['weekLabel'] || ''),
            date: String(r['Date'] || r['date'] || ''),
            day: String(r['Day'] || r['day'] || ''),
            slotType: String(r['Slot Type'] || r['slotType'] || 'Main'),
            laneCode: String(r['Lane Code'] || r['Lane'] || r['laneCode'] || ''),
            pillarCode: String(r['Pillar Code'] || r['Pillar'] || r['pillarCode'] || ''),
            seriesCode: String(r['Series Code'] || r['Series'] || r['seriesCode'] || ''),
            topic: String(r['Topic'] || r['topic'] || ''),
            format: String(r['Format'] || r['format'] || ''),
            approvalLevel: String(r['Approval Level'] || r['Approval'] || r['approvalLevel'] || ''),
            difficultyScore: Number(r['Difficulty Score'] || r['Difficulty'] || r['difficultyScore'] || 2),
            status: String(r['Status'] || r['status'] || 'Planned'),
            priority: String(r['Priority'] || r['priority'] || ''),
            funnelStage: String(r['Funnel Stage'] || r['Funnel'] || r['funnelStage'] || ''),
            notes: String(r['Notes'] || r['notes'] || ''),
          })).filter(r => r.postCode);
          if (mapped.length) { const res = await bulkInsertPosts(mapped); imported = res.imported; }
        } else if (target === 'contentIdeas') {
          const mapped = rows.map(r => ({
            menuId: String(r['Menu ID'] || r['ID'] || r['menuId'] || ''),
            laneCode: String(r['Lane Code'] || r['Lane'] || r['laneCode'] || ''),
            pillarCode: String(r['Pillar Code'] || r['Pillar'] || r['pillarCode'] || ''),
            seriesCode: String(r['Series Code'] || r['Series'] || r['seriesCode'] || ''),
            ideaTitle: String(r['Idea Title'] || r['Title'] || r['ideaTitle'] || ''),
            description: String(r['Description'] || r['description'] || ''),
            readinessStatus: String(r['Readiness Status'] || r['Readiness'] || r['readinessStatus'] || 'New'),
            notes: String(r['Notes'] || r['notes'] || ''),
          })).filter(r => r.menuId);
          if (mapped.length) { const res = await bulkInsertContentIdeas(mapped); imported = res.imported; }
        } else if (target === 'optionalPosts') {
          const mapped = rows.map(r => ({
            postCode: String(r['Post Code'] || r['Code'] || r['postCode'] || ''),
            topic: String(r['Topic'] || r['topic'] || ''),
            laneCode: String(r['Lane Code'] || r['Lane'] || r['laneCode'] || ''),
            whyEasy: String(r['Why Easy'] || r['Why It Is Easy'] || r['whyEasy'] || ''),
            whenToUse: String(r['When to Use'] || r['whenToUse'] || ''),
            notes: String(r['Notes'] || r['notes'] || ''),
          })).filter(r => r.postCode);
          if (mapped.length) { const res = await bulkInsertOptionalPosts(mapped); imported = res.imported; }
        } else if (target === 'videos') {
          const mapped = rows.map(r => ({
            videoId: String(r['Video ID'] || r['ID'] || r['videoId'] || ''),
            topic: String(r['Topic'] || r['topic'] || ''),
            productionStage: String(r['Production Stage'] || r['Stage'] || r['productionStage'] || 'Concept'),
            hook: String(r['Hook'] || r['hook'] || ''),
            notes: String(r['Notes'] || r['notes'] || ''),
          })).filter(r => r.videoId);
          if (mapped.length) { const res = await bulkInsertVideos(mapped); imported = res.imported; }
        } else if (target === 'backlog') {
          const mapped = rows.map(r => ({
            legacyCode: String(r['Legacy Code'] || r['Code'] || r['legacyCode'] || ''),
            topic: String(r['Topic'] || r['topic'] || ''),
            whyKeep: String(r['Why Keep'] || r['whyKeep'] || ''),
            notes: String(r['Notes'] || r['notes'] || ''),
          })).filter(r => r.legacyCode || r.topic);
          if (mapped.length) { const res = await bulkInsertBacklog(mapped); imported = res.imported; }
        }

        result.sheets[sheetName] = { imported, skipped };
      } catch (err: any) {
        result.sheets[sheetName] = { imported: 0, skipped: 0, error: err.message };
      }
    }
  }

  return result;
}

export async function exportCsv(table: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const tableMap: Record<string, any> = {
    posts, contentIdeas, optionalPosts, videos, backlog, metrics, lanes, pillars, series, angles,
  };
  const t = tableMap[table];
  if (!t) throw new Error('Unknown table: ' + table);
  const data = await db.select().from(t);
  if (data.length === 0) return { csv: '', filename: `${table}.csv` };

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    csvRows.push(headers.map(h => {
      const val = String((row as any)[h] ?? '');
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? '"' + val.replace(/"/g, '""') + '"'
        : val;
    }).join(','));
  }
  return { csv: csvRows.join('\n'), filename: `${table}-${new Date().toISOString().split('T')[0]}.csv` };
}

export async function exportExcel() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const workbook = XLSX.utils.book_new();

  // Lanes
  const lanesData = await db.select().from(lanes);
  const lanesSheet = XLSX.utils.json_to_sheet(lanesData.map(l => ({ 'Lane Code': l.code, 'Lane Name': l.name })));
  XLSX.utils.book_append_sheet(workbook, lanesSheet, 'Lanes');

  // Pillars
  const pillarsData = await db.select().from(pillars);
  const pillarsSheet = XLSX.utils.json_to_sheet(pillarsData.map(p => ({ 'Pillar Code': p.code, 'Pillar Name': p.name })));
  XLSX.utils.book_append_sheet(workbook, pillarsSheet, 'Pillars');

  // Series
  const seriesData = await db.select().from(series);
  const seriesSheet = XLSX.utils.json_to_sheet(seriesData.map(s => ({ 'Series Code': s.code, 'Series Name': s.name })));
  XLSX.utils.book_append_sheet(workbook, seriesSheet, 'Series');

  // Angles
  const anglesData = await db.select().from(angles);
  const anglesSheet = XLSX.utils.json_to_sheet(anglesData.map(a => ({ 'Angle Code': a.code, 'Angle Name': a.name })));
  XLSX.utils.book_append_sheet(workbook, anglesSheet, 'Angles');

  // Posts
  const postsData = await db.select().from(posts);
  const postsSheet = XLSX.utils.json_to_sheet(postsData.map(p => ({
    'Post Code': p.postCode, 'Week Label': p.weekLabel, 'Date': p.date, 'Day': p.day,
    'Slot Type': p.slotType, 'Lane Code': p.laneCode, 'Pillar Code': p.pillarCode,
    'Series Code': p.seriesCode, 'Topic': p.topic, 'Format': p.format,
    'Approval Level': p.approvalLevel, 'Difficulty Score': p.difficultyScore,
    'Status': p.status, 'Priority': p.priority, 'Funnel Stage': p.funnelStage, 'Notes': p.notes,
  })));
  XLSX.utils.book_append_sheet(workbook, postsSheet, 'Post Detail DB');

  // Content Ideas
  const ideasData = await db.select().from(contentIdeas);
  const ideasSheet = XLSX.utils.json_to_sheet(ideasData.map(i => ({
    'Menu ID': i.menuId, 'Lane Code': i.laneCode, 'Pillar Code': i.pillarCode,
    'Series Code': i.seriesCode, 'Idea Title': i.ideaTitle, 'Description': i.description,
    'Readiness Status': i.readinessStatus, 'Notes': i.notes,
  })));
  XLSX.utils.book_append_sheet(workbook, ideasSheet, 'Content Bank Menu');

  // Optional Pool
  const optData = await db.select().from(optionalPosts);
  const optSheet = XLSX.utils.json_to_sheet(optData.map(o => ({
    'Post Code': o.postCode, 'Topic': o.topic, 'Lane Code': o.laneCode,
    'Why Easy': o.whyEasy, 'When to Use': o.whenToUse, 'Notes': o.notes,
  })));
  XLSX.utils.book_append_sheet(workbook, optSheet, 'Optional Pool');

  // Videos
  const videosData = await db.select().from(videos);
  const videosSheet = XLSX.utils.json_to_sheet(videosData.map(v => ({
    'Video ID': v.videoId, 'Topic': v.topic, 'Production Stage': v.productionStage,
    'Hook': v.hook, 'Notes': v.notes,
  })));
  XLSX.utils.book_append_sheet(workbook, videosSheet, 'Video Pipeline');

  // Backlog
  const backlogData = await db.select().from(backlog);
  const backlogSheet = XLSX.utils.json_to_sheet(backlogData.map(b => ({
    'Legacy Code': b.legacyCode, 'Topic': b.topic, 'Why Keep': b.whyKeep, 'Notes': b.notes,
  })));
  XLSX.utils.book_append_sheet(workbook, backlogSheet, 'Backlog');

  // Metrics
  const metricsData = await db.select().from(metrics);
  const metricsSheet = XLSX.utils.json_to_sheet(metricsData.map(m => ({
    'Post Code': m.postCode, 'Date Posted': m.datePosted, 'Week': m.weekLabel,
    'Topic': m.topic, 'Reach': m.reach, 'Views': m.views,
    'Reactions': m.reactions, 'Comments': m.comments, 'Shares': m.shares,
    'Saves': m.saves, 'Clicks': m.clicks, 'Leads': m.leads,
  })));
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');

  // Activity Log
  const logData = await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(500);
  const logSheet = XLSX.utils.json_to_sheet(logData.map(l => ({
    'Action': l.action, 'Entity': l.entityType, 'Entity ID': l.entityId,
    'Details': l.details, 'Date': l.createdAt,
  })));
  XLSX.utils.book_append_sheet(workbook, logSheet, 'Activity Log');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return { data: Buffer.from(buf).toString('base64') };
}

// ─── V2: Calendar Notes ───
export async function getCalendarNotes(month?: string) {
  const db = await getDb();
  if (!db) return [];
  if (month) {
    return db.select().from(calendarNotes).where(like(calendarNotes.date, `${month}%`));
  }
  return db.select().from(calendarNotes).orderBy(desc(calendarNotes.date));
}

export async function createCalendarNote(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(calendarNotes).values(data).$returningId();
  return { id: result.id, ...data };
}

export async function updateCalendarNote(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(calendarNotes).set(data).where(eq(calendarNotes.id, id));
  return { id, ...data };
}

export async function deleteCalendarNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(calendarNotes).where(eq(calendarNotes.id, id));
}

export async function toggleCalendarNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [note] = await db.select().from(calendarNotes).where(eq(calendarNotes.id, id));
  if (!note) throw new Error("Note not found");
  await db.update(calendarNotes).set({ completed: !note.completed }).where(eq(calendarNotes.id, id));
  return { ...note, completed: !note.completed };
}

// ─── V2: Whiteboards ───
export async function getAllWhiteboards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whiteboards).orderBy(desc(whiteboards.updatedAt));
}

export async function getWhiteboard(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [wb] = await db.select().from(whiteboards).where(eq(whiteboards.id, id));
  return wb;
}

export async function createWhiteboard(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(whiteboards).values(data).$returningId();
  return { id: result.id, ...data };
}

export async function updateWhiteboard(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(whiteboards).set(data).where(eq(whiteboards.id, id));
  return { id, ...data };
}

export async function deleteWhiteboard(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(whiteboards).where(eq(whiteboards.id, id));
}

// ─── V2: Copy Templates ───
export async function getAllCopyTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(copyTemplates).orderBy(desc(copyTemplates.updatedAt));
}

export async function createCopyTemplate(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(copyTemplates).values(data).$returningId();
  return { id: result.id, ...data };
}

export async function updateCopyTemplate(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(copyTemplates).set(data).where(eq(copyTemplates.id, id));
  return { id, ...data };
}

export async function deleteCopyTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(copyTemplates).where(eq(copyTemplates.id, id));
}

// ─── V2: Archive Posts ───
export async function archivePost(id: number, month: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(posts).set({ archived: true, archivedMonth: month, status: 'Archived' }).where(eq(posts.id, id));
}

export async function unarchivePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(posts).set({ archived: false, archivedMonth: null, status: 'Published' }).where(eq(posts.id, id));
}

export async function getArchivedPosts(month?: string) {
  const db = await getDb();
  if (!db) return [];
  if (month) {
    return db.select().from(posts).where(and(eq(posts.archived, true), eq(posts.archivedMonth, month)));
  }
  return db.select().from(posts).where(eq(posts.archived, true)).orderBy(desc(posts.updatedAt));
}

// ─── V2: Update post copywriting ───
export async function updatePostCopywriting(id: number, data: { caption?: string | null; hashtags?: string | null; cta?: string | null; copyTemplate?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(posts).set(data).where(eq(posts.id, id));
}

// ─── V3: Todos ───
export async function getAllTodos() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(todos).orderBy(todos.sortOrder, todos.createdAt);
}
export async function createTodo(data: any) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(todos).values(sanitize(data) as any).$returningId();
  return { id: result.id, ...data };
}
export async function updateTodo(id: number, data: any) {
  const db = await getDb(); if (!db) return;
  await db.update(todos).set(sanitize(data)).where(eq(todos.id, id));
}
export async function deleteTodo(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(todos).where(eq(todos.id, id));
}
// ─── V3: Post image and review ───
export async function updatePostImage(id: number, imageUrl: string | null) {
  const db = await getDb(); if (!db) return;
  await db.update(posts).set({ imageUrl }).where(eq(posts.id, id));
}
export async function updatePostReview(id: number, reviewStatus: string, reviewNotes?: string | null) {
  const db = await getDb(); if (!db) return;
  await db.update(posts).set({ reviewStatus, reviewNotes: reviewNotes ?? null }).where(eq(posts.id, id));
}
export async function getPostsForReview() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(posts).where(
    or(
      eq(posts.reviewStatus, 'pending'),
      eq(posts.reviewStatus, 'approved'),
      eq(posts.reviewStatus, 'rejected')
    )
  ).orderBy(desc(posts.updatedAt));
}
