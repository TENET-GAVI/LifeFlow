# LifeFlow

LifeFlow 是一个 iPhone 生活节律应用项目，目标是帮助用户管理今日计划、长期习惯、每日总结、学习进度和趋势反馈。

## Current Status

项目目前是一个可安装到手机主屏幕的 PWA 原型，已包含：

- `prototype/index.html`：iPhone 高保真交互原型。
- `prototype/app.js`：本地用户隔离、任务新建、每日总结、真实趋势记录、本地复盘建议。
- `api/analyze-day.js`：Vercel Serverless 版 DeepSeek 每日复盘分析接口。
- `docs/product-design.md`：产品设计稿。
- `docs/phone-install.md`：手机安装说明。
- `docs/ai-and-cloud-plan.md`：DeepSeek + Supabase 长期方案。

## Product Direction

第一版 MVP 聚焦四个底部 Tab：

- 今日：今日三件事、习惯完成度、复盘入口。
- 习惯：习惯列表、目标、时间段、新建任务。
- 复盘：每日总结、学习进度、需要改进的地方、明日调整、AI 建议。
- 趋势：按日期保存的真实每日记录，不使用虚拟数据。

## AI / Cloud Note

GitHub Pages 只能部署静态页面，不能安全保存 API Key。DeepSeek 接入需要部署到 Vercel，并在 Vercel 环境变量里配置：

```text
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-v4-flash
```

当前前端会优先调用 `/api/analyze-day`。如果接口不可用，会自动回退到本地规则版复盘建议。

真正的账号登录、云端同步、跨设备数据，需要后续接入 Supabase。当前登录仍是本机用户隔离。

## Preview

本地直接打开：

```text
prototype/index.html
```

线上 GitHub Pages：

```text
https://tenet-gavi.github.io/LifeFlow/prototype/
```

AI 接口需要 Vercel 部署，GitHub Pages 不会运行 `/api/analyze-day`。
