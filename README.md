# GitHub Release Watcher（GitHub Actions 定时推送）

## 原理
GitHub Actions 每小时运行 check.mjs：查 feeds.json 里各仓库的最新 release/tag/commit，
与仓库里的 state.json 比对，有变化则通过 Server酱推送到微信。

## 一次性配置（10 分钟）
1. 在 GitHub 新建一个 **公开仓库**（如 `release-watcher`），把本目录全部文件上传；
2. 申请 Server酱 SendKey：https://sct.ftqq.com （微信扫码登录，免费额度每天约 30 条，够用）；
3. 仓库 → Settings → Secrets and variables → Actions → New repository secret：
   - 名称 `SENDKEY`，值 = 上一步的 SendKey；
   - （可选）名称 `GH_TOKEN`，值 = 只勾 read:packages 的 GitHub Token（不配置则走匿名额度 60 次/小时，
     25 个源每小时 25 次，够用，但共享 IP 额度有风险，建议配置）；
4. 按你的需求编辑 feeds.json（owner/repo/type，type: release|tag|commit）；
5. Actions 页签 → 启用 Actions → 手动 Run 一次 workflow 验证；
6. 收到第一条推送（汇总当前版本基线）即成功；之后每小时自动检查。

## 注意
- 公开仓库 Actions 免费且无分钟数限制；私有仓库每月 2000 分钟也够；
- GitHub 定时任务可能延迟 5~30 分钟，对版本更新通知无所谓；
- state.json 记录基线版本，首次运行后所有源都会视为"已存在"，从下一次变更开始推送；
- 此方案与 RSS 阅读器互补：推送负责"提醒有更新"，MrRSS（CF 线）负责"浏览更新详情"。
