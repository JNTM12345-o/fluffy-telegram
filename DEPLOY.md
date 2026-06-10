# 🚀 极速抢答 · 云端部署指南

## 方案一：Railway（后端）+ Vercel（前端）

### 第一步：初始化 Git 仓库

```bash
cd d:\文档\qdyx
git init
git add .
git commit -m "Initial commit"
```

### 第二步：推送代码到 GitHub

1. 登录 [GitHub](https://github.com)
2. 创建新仓库 `qdyx-game`
3. 推送代码：
```bash
git remote add origin https://github.com/你的用户名/qdyx-game.git
git branch -M main
git push -u origin main
```

### 第三步：部署后端到 Railway

1. 访问 [Railway.app](https://railway.app)
2. 用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择 `qdyx-game` 仓库
5. Railway 会自动检测到 Node.js
6. **重要**：设置环境变量
   - `PORT`: `8080`
7. 等待部署完成，记下 WebSocket 地址（如 `wss://qdyx-game.up.railway.app`）

### 第四步：部署前端到 Vercel

1. 访问 [Vercel.com](https://vercel.com)
2. 用 GitHub 登录
3. 点击 "Add New Project"
4. 导入 `qdyx-game` 仓库
5. 设置环境变量：
   - `VITE_WS_URL`: `wss://你的-railway-app-name.up.railway.app`
6. 点击 "Deploy"

### 第五步：访问游戏

部署完成后，Vercel 会给你一个域名，如：`https://qdyx-game.vercel.app`

手机直接访问：`https://qdyx-game.vercel.app`

---

## 方案二：Zeabur（后端，更简单）

1. 访问 [Zeabur](https://zeabur.com)
2. 用 GitHub 登录
3. 创建新服务 → 从 GitHub 部署
4. 选择 `api` 文件夹作为部署目录
5. 记下分配的域名

---

## 方案三：Render（后端，免费）

1. 访问 [Render](https://render.com)
2. 创建 Web Service
3. 连接 GitHub 仓库
4. 设置：
   - Root Directory: `api`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 记下 WebSocket 地址

---

## 🔧 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_WS_URL` | WebSocket 服务器地址 | `wss://game.railway.app` |

---

## 📱 手机访问

部署完成后，所有人（包括手机）都可以直接访问 Vercel 分配的域名，无需在同一局域网！

---

## 🆘 常见问题

**Q: 手机显示连接失败**
- 检查 `VITE_WS_URL` 是否正确设置为 WebSocket 地址（`wss://` 开头）
- 检查后端服务是否正常运行

**Q: Railway/Render 冷启动慢**
- 免费套餐有冷启动延迟，首次连接可能需要等待 30 秒

**Q: 如何更新游戏**
- 推送新代码到 GitHub 后，Railway/Vercel 会自动重新部署
