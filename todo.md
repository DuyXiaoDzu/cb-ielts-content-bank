# CB IELTS Content Bank - Migration TODO

## Phase 2: Database Schema
- [x] Copy full schema.ts from source (lanes, pillars, series, angles, posts, contentIdeas, optionalPosts, videos, metrics, backlog, activityLog, calendarNotes, whiteboards, copyTemplates, todos)
- [x] Apply all SQL migrations via webdev_execute_sql

## Phase 3: Server-side Code
- [x] Migrate server/db.ts (all query helpers)
- [x] Migrate server/routers.ts (all tRPC procedures)
- [x] Migrate server/storage.ts
- [x] Migrate server/features.test.ts

## Phase 4: Frontend
- [x] Migrate client/src/index.css (theme/colors)
- [x] Migrate client/src/App.tsx (routes)
- [x] Migrate client/src/main.tsx
- [x] Migrate client/src/const.ts
- [x] Migrate client/src/lib/constants.ts
- [x] Migrate client/src/lib/utils.ts
- [x] Migrate client/src/hooks/useComposition.ts
- [x] Migrate client/src/hooks/useMobile.tsx
- [x] Migrate client/src/hooks/usePersistFn.ts
- [x] Migrate client/src/pages/Home.tsx (Dashboard)
- [x] Migrate client/src/pages/Planning.tsx
- [x] Migrate client/src/pages/Ideas.tsx
- [x] Migrate client/src/pages/Optional.tsx
- [x] Migrate client/src/pages/Videos.tsx
- [x] Migrate client/src/pages/Copywriting.tsx
- [x] Migrate client/src/pages/Whiteboard.tsx
- [x] Migrate client/src/pages/Backlog.tsx
- [x] Migrate client/src/pages/Metrics.tsx
- [x] Migrate client/src/pages/Settings.tsx
- [x] Migrate client/src/pages/NotFound.tsx
- [x] Migrate client/src/components/DashboardLayout.tsx
- [x] Migrate client/src/components/PostDetailModal.tsx
- [x] Migrate client/src/components/StatusBadge.tsx
- [x] Migrate all shadcn/ui components

## Phase 5: Shared & Config
- [x] Migrate shared/types.ts and shared/const.ts
- [x] Migrate shared/_core/errors.ts
- [x] Migrate patches/wouter patch
- [x] Copy components.json

## Phase 6: Testing
- [x] Run pnpm test (38/38 passed)
- [x] Verify all pages load correctly (confirmed via screenshot)
- [x] Verify database CRUD operations (schema applied successfully)

## Tính năng mới (28/03/2026)

- [x] Liên kết Video Pipeline ↔ Planning Board: posts slotType=Video hiện ở cả 2 nơi, tab Video chỉ cho edit video-specific fields
- [x] PostDetailModal: Quick Checklist có thể tick/untick từng item
- [x] PostDetailModal: Copy button copy toàn bộ thông tin post dạng text để paste vào AI
- [x] PostDetailModal: Priority tabs (Overview/Content/Review/Details) có màu theo mức độ quan trọng
- [x] PostDetailModal: AI Parse — paste bài viết hoàn chỉnh → AI tự tách hook/body/hashtag/CTA điền vào fields
- [x] PostDetailModal: Tab Review = Facebook Post Mockup (preview bài đăng FB hoàn chỉnh)
- [x] Whiteboard: Sửa text tool — có thể click vào canvas và gõ chữ được
