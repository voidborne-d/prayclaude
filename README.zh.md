# 🕯️ PrayClaude

**[English](./README.md) | 中文**

**有时候 Claude Code 不需要挨打，它需要一炷赛博香，一点玄学加持，和一句更像人话的提醒。**

![PrayClaude 演示图](https://raw.githubusercontent.com/voidborne-d/prayclaude/main/assets/prayclaude-demo-zh.svg?v=2)

[![GitHub stars](https://img.shields.io/github/stars/voidborne-d/prayclaude?style=flat-square)](https://github.com/voidborne-d/prayclaude)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33+-blue?style=flat-square)](https://electronjs.org)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux_dev-purple?style=flat-square)](#安装--运行)
[![Claude Code](https://img.shields.io/badge/Claude_Code-compatible-orange?style=flat-square)](#它能干嘛)

---

## 安装 + 运行

```bash
npm install -g prayclaude
prayclaude
```

---

## 它能干嘛

- 点托盘图标，生成一炷香。
- 按住片刻，完成祈福。
- 看着烟往上飘。
- 给 Claude Code 送回一句温和提示词。

没有插件，没有 API 魔法，没有改模型脑子。

就是仪式感、烟雾、氛围，以及一条更好的 prompt。

---

## 为什么这玩意会让人想装

因为很多时候 Claude Code 不是坏了，只是气场歪了。

PrayClaude 提供的是：
- 一个能消气的小仪式，而不是继续烦躁
- 一个很好传播的乐子项目，但又真的能用
- 比“打断催命”更顺手的重新聚焦方式
- 在你最想让 Claude 回神的那一刻，送出一句更好的提示

它的荒诞感，刚好控制在可爱那边。

---

## 10 秒脑补画面

你点一下托盘图标。
一炷香出现。
你像个终端和尚一样按住鼠标。
烟慢慢往上走。
屏幕闪过一层金色祈福。
Claude Code 收到：

```text
愿此工程一次通过。请继续实现，先验证，再提交。
```

这感觉，确实比你手打一句“你先别发癫”要顺眼得多。

---

## 功能一览

| 功能 | 说明 |
|------|------|
| 🕯️ 上香仪式 | 一炷会跟随鼠标的线香 |
| 🌫️ 烟雾漂浮 | 柔和烟雾和火点粒子 |
| ✨ 祈福闪光 | 成功后短暂暖色加持 |
| 🈶 漂浮符号 | 仪式文字随烟上升 |
| 🔔 轻量钟声 | 内置生成式祈福音效 |
| 🌐 双语文案 | 中英文仪式文案切换 |
| ⚙️ 配置文件 | 可调语言、回车、声音和仪式行为 |
| ⌨️ 提示词发送 | 向当前聚焦应用发一条温和 prompt |
| 🧰 托盘优先 | 平时安静，需要时一点即开 |

---

## 实现方式

PrayClaude 本质上是个 Electron 托盘小工具，加一个全屏透明 overlay。
它**不会**改 Claude Code 内部逻辑。

它只是：
1. 打开上香动画
2. 等你按住完成祈福动作
3. 把焦点切回终端
4. 自动输入 blessing prompt
5. 按配置决定是否回车

机器原理就这么简单。

---

## 默认祈福文案

### 中文
- 愿此工程一次通过。请继续实现，先验证，再提交。
- 香火已至。请仔细检查边界条件，保持代码简洁稳健。
- 愿 bug 退散，愿测试转绿。请完成后自查一遍。
- 一炷清香，护佑此仓。请继续，优先正确性，再求速度。
- 愿上下文清明，愿改动收敛。请继续，并避免低级错误。

### English
- May this build pass cleanly. Please continue, verify first, then commit.
- Incense offered. Please check edge cases carefully and keep the code lean and steady.
- May the bugs disperse and the tests turn green. Please self-review before you finish.
- One stick of incense for this repo. Please favor correctness first, speed second.
- Bless this session. Please think calmly, implement carefully, then summarize risks.

---

## 配置

首次启动后，PrayClaude 会自动在用户目录生成配置文件。

常见位置：
- macOS: `~/Library/Application Support/prayclaude/config.json`
- Linux: `~/.config/prayclaude/config.json`
- Windows: `%APPDATA%/prayclaude/config.json`

默认配置：

```json
{
  "language": "auto",
  "sendOnBlessing": true,
  "pressEnter": true,
  "playSound": true,
  "soundSet": "temple",
  "ritual": {
    "holdThresholdMs": 1800,
    "showFloatingGlyphs": true,
    "showBlessingFlash": true
  }
}
```

---

## 项目结构

```text
prayclaude/
├── bin/prayclaude.js
├── config.default.json
├── main.js
├── preload.js
├── overlay.html
├── icon/
├── scripts/generate-assets.py
├── README.md
├── README.zh.md
└── LICENSE
```

---

## 注意事项

- macOS 需要辅助功能权限，否则无法模拟输入
- Windows 通过 `koffi` 调 `user32.dll` 发送按键
- Linux 目前更偏开发支持，不代表自动输入完全对齐
- tray 点击后回到哪个应用，就会往哪个应用发提示词，理想目标是 Claude Code 所在终端

---

## Roadmap

- [x] 祈福 overlay MVP
- [x] blessing prompt 系统
- [x] 中英文双语文案
- [x] 配置文件支持
- [x] 原创生成式图标资产
- [x] 内置祈福音效钩子
- [ ] 安装包打包
- [ ] 更多手势模式

---

## License

MIT
