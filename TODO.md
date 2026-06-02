# DoraPocket 待办

## 当前焦点

- [ ] 全面的自动化测试流程构建
- [ ] 质量门禁优化
- [ ] 学习 Agent 工作流
- [ ] 考虑匹配度增加一个阈值，低于某个阈值的不推荐
- [ ] 学习 Agent 工作流
- [ ] Tool详情页

## 架构 — 工具数据源（下一轮，本轮不做）

- [ ] 移除 `src/shared/market-bookmark-seeds.ts` 作为运行时数据源
- [ ] Market 工具以 DB 为单源；`getToolById` / UI 改 DB（+ 缓存）
- [ ] Builtin 保留代码内小表；seed 仅 builtin 或外部 dump

## 本轮实施

- [x] 删除 `src/app/pocket/page.tsx`
- [x] Auth：Supabase `signInWithOAuth` + `/api/auth/callback`，移除自定义 OAuth
- [x] 竞态：Zustand 分析切片 + turnId + Abort

## 已完成（归档）

- 2026-06-02：上述本轮三项
