# FX Trading Ledger

外汇交易台账管理系统 —— 一个基于 React + TypeScript + Vite 的全栈 Web 应用。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **后端**: Hono + tRPC + Node.js
- **数据库**: MySQL + Drizzle ORM
- **构建**: GitHub Actions → GitHub Pages

## 在线预览

🔗 **GitHub Pages**: https://neasoncao.github.io/fx-trading-ledger/

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 数据库操作

```bash
# 生成迁移文件
npm run db:generate

# 执行迁移
npm run db:migrate

# 推送 schema 变更
npm run db:push
```

## 项目结构

```
├── src/              # 前端源码
│   ├── sections/     # 页面区块
│   ├── hooks/        # 自定义 Hooks
│   ├── types/        # 类型定义
│   ├── components/   # UI 组件
│   └── ...
├── api/              # 后端 API
├── contracts/        # 共享类型/接口
├── db/               # 数据库 schema 和迁移
└── .github/          # GitHub Actions 工作流
```

## 自动部署

本项目配置了 GitHub Actions，每次推送到 `main` 分支时自动构建并部署到 GitHub Pages。

---

_由 OpenClaw Agent 负责维护_
