# DoraPocket 待办

## 当前焦点

- [ ] 全面的自动化测试流程构建
- [ ] 质量门禁优化
- [ ] 学习 Agent 工作流
- [ ] 考虑匹配度增加一个阈值，低于某个阈值的不推荐
- [ ] Tool详情页（暂缓）

## 架构 — 工具数据源

- [x] 删除 `market-bookmark-seeds.ts` 等遗留 seed 源文件；市场目录仅以 `scripts/data/market-catalog-snapshot.json` + DB 为准
- [x] Market 工具以 DB 为单源；UI 经 `/api/market/tools/batch` + React Query
- [x] Builtin 保留代码内小表；`seed:tools` 仅 builtin

## 本轮实施

- [x] 删除 `src/app/pocket/page.tsx`
- [x] Auth：Supabase `signInWithOAuth` + `/api/auth/callback`，移除自定义 OAuth
- [x] 竞态：Zustand 分析切片 + turnId + Abort
- [x] Market DB 单源（batch API、分析页 lookup、registry 收缩）

## 已完成（归档）

- 2026-06-02：OAuth 单轨、分析揭晓流程
- 2026-06-02：Market DB 单源迁移
