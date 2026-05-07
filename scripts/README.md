# DoraPocket Scripts

这些脚本用于 Tool Hub 和市场资产维护。当前先整理用途与风险标识，不在本轮决定删除、合并或迁移。

本轮瘦身只清理前端不可达 UI 与旧页面工作台组件，脚本文件本身未删除。

## 安全标识

- `Local only`：只处理本地文件或生成本地数据。
- `Database write`：会写入数据库，需要确认 `DATABASE_URL` 等环境变量。
- `External network`：会访问外网或第三方资源。
- `External write`：会写入 OSS 等外部服务。

## 数据库与工具种子

### `seed-tools.ts`

- 标识：`Database write`
- 用途：把系统工具种子写入数据库。
- 注意：运行前确认目标数据库，避免把本地测试数据写入生产环境。

## 收藏夹/工具源构建

### `build-bookmark-seeds.mjs`

- 标识：`Local only`
- 用途：构建市场收藏夹种子数据。
- 状态：属于 Tool Hub 扩展资料处理，不是当前主体验必需链路。

### `refine-market-bookmark-seeds.mjs`

- 标识：`Local only`
- 用途：整理或修正市场收藏夹种子数据。
- 状态：属于后续工具源治理辅助脚本。

## Favicon 资产维护

### `fetch-market-favicons.mjs`

- 标识：`External network`、`Local only`
- 用途：抓取市场工具 favicon，并生成或更新本地 favicon 资产。
- 注意：会访问外部站点，运行前确认网络环境和目标来源。

### `upload-market-favicons-to-oss.mjs`

- 标识：`External write`、`External network`
- 用途：把市场 favicon 上传到 OSS。
- 注意：有外部写入副作用，运行前必须确认 OSS bucket、路径前缀和访问密钥。

## 整理原则

- 未确认目标前，不运行带 `External write` 的脚本。
- 未确认数据库前，不运行带 `Database write` 的脚本。
- 外部来源导入、RAG、去重、精选和治理仍属于后置能力。
- 后续再决定是否合并脚本入口、删除废弃脚本或迁移到专门的 Tool Hub 维护命令。
