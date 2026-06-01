# 手机独立使用方式

## 推荐路线：作为 PWA 安装到 iPhone 主屏幕

当前 `prototype/` 已经具备 PWA 基础文件：

- `index.html`
- `site.webmanifest`
- `sw.js`
- `icon.svg`

但 iPhone 要把网页当成独立 App 使用，最好通过 HTTPS 地址访问。局域网地址例如 `http://192.168.1.89:4177/` 适合临时测试，但电脑关掉后手机就不能继续访问。

## 安装步骤

1. 把 `prototype/` 部署到一个 HTTPS 静态托管地址，例如 GitHub Pages、Netlify、Vercel 或 Cloudflare Pages。
2. 用 iPhone Safari 打开部署后的 HTTPS 地址。
3. 点击分享按钮。
4. 选择“添加到主屏幕”。
5. 从主屏幕打开 LifeFlow。
6. 第一次联网打开后，核心页面会被缓存，之后可以离线打开。

## 数据保存

当前原型会把以下内容按“本机用户名”保存在手机 Safari 的本地存储中：

- 习惯完成状态。
- 每日总结：当天发生的事情、学习进度、需要改进的地方、明天如何调整。
- 每日记录：日期、完成数量、完成率、是否已总结。

这不是云端账号系统，也不是安全认证。它只能避免同一份代码在不同手机或同一手机的不同本地用户之间混用数据。删除网站数据、换手机或换浏览器会丢失。

如果需要真正的登录、云端同步、跨设备使用，需要接入后端，例如 Supabase、Firebase 或自建 API。

## 真正的 iOS App 路线

如果目标是完全原生 App，需要后续用 SwiftUI 重建：

- SwiftUI：界面。
- SwiftData：本地数据。
- UserNotifications：提醒。
- Swift Charts：趋势图。
- CloudKit：未来同步。
