# LifeFlow

LifeFlow 是一个 iPhone 应用项目，目标是帮助用户建立更稳定的生活节律：今日计划、长期习惯、晚间复盘和趋势反馈。

## Current Status

项目目前处于产品设计和原型阶段，已创建：

- `docs/product-design.md`：第一版产品设计稿、范围、核心闭环、验收标准和 iOS 实现建议。
- `prototype/index.html`：可直接打开的 iPhone 高保真交互原型。
- `prototype/app.js`：本地用户隔离、任务新建、每日总结、真实趋势记录逻辑。
- `docs/phone-install.md`：把原型作为 PWA 安装到 iPhone 主屏幕的说明。

## Product Direction

第一版 MVP 聚焦四个底部 Tab：

- 今日：今日三件事、习惯完成度、复盘入口。
- 习惯：习惯列表、目标、时间段、稳定度。
- 复盘：每日总结、学习进度、需要改进的地方、明日调整。
- 趋势：按日期保存的真实每日记录，不使用虚拟数据。

## Data Model Note

当前 GitHub Pages 版本是静态 PWA，没有后端数据库。登录是“本机用户隔离”：不同用户名会写入不同的浏览器本地存储空间，适合个人手机使用和分享代码后避免数据混用。

真正的账号登录、云端同步、跨设备数据，需要后续接入 Supabase、Firebase 或自建 API。

## How To Preview

直接打开：

```text
prototype/index.html
```

如果想在手机上像独立 App 一样使用，参考：

```text
docs/phone-install.md
```

## Suggested Next Step

继续时可以选择：

- 继续打磨高保真原型的视觉和交互。
- 把原型转成 React / Vite 项目。
- 把产品设计转成 SwiftUI 项目结构。
