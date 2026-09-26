# 校园二手交易平台

面向高校学生，提供校内二手物品交易、书籍交换和失物招领的C2C平台。

## Docker Compose 快速启动

首次启动前复制环境变量文件：

```bash
cp .env.example .env
docker compose up -d
```

访问地址：

- 前端：http://localhost:28514
- 后端健康检查：http://localhost:29514/health
- API 示例：http://localhost:28514/api/overview

## 项目主要功能

- 商品发布与校内分类：学生发布闲置物品（书籍/电子产品/生活用品/服饰），填写标题、描述、价格、成色，选择校区和交易地点，上传实拍图片。
- 价格协商私信：买家对感兴趣的商品可与卖家发起私信沟通，协商价格、约定线下交易时间和地点，系统保留聊天记录备查。
- 交易达成确认：买卖双方线下完成交易后，在平台点击确认交易完成，卖家确认收款，买家确认收货，交易完成后商品自动下架。
- 信誉评分与举报：交易完成后双方互评（好评/中评/差评），累计信誉分，用户可举报虚假商品或欺诈行为，管理员介入处理。
- 毕业季专场与书籍交换：毕业季期间开设专场活动，集中展示毕业生闲置物品；开设书籍交换板块，学生发布可交换书籍和想换书籍，系统撮合匹配。
- 失物招领：失主发布寻物启事、拾取者登记招领物品，双方统一填写校区、地点、时间和物品特征。每则启事只接受一条有效认领，重复或同时认领时先提交的生效，后来者会看到“已被认领”；特征不符或启事已关闭时返回具体原因。双方线下核对无误后确认交接，启事关闭并留下处理结果；招领启事满七天无人认领自动转入公开列表。总览可按寻物、招领、公开列表、已完成分视图查看。

## 失物招领 API

统一前缀 `/api/lost-found`（经前端代理访问；直连后端时 `/lost-found` 前缀同样可用）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/meta` | 校区与物品类别字典 |
| GET | `/overview` | 寻物 / 招领 / 核对中 / 公开 / 已完成数量统计 |
| GET | `/posts?view=lost\|found\|public\|done&campus=` | 分视图列出启事，可按校区过滤 |
| GET | `/posts/:id` | 启事详情（含认领记录） |
| POST | `/posts` | 发布寻物启事或招领登记 |
| POST | `/posts/:id/claims` | 提交认领匹配（事务内行级锁，先提交者生效） |
| POST | `/posts/:id/close` | 发布人关闭启事并留下处理结果 |
| POST | `/claims/:claimId/confirm` | 线下核对无误，确认交接并关闭启事 |
| POST | `/claims/:claimId/reject` | 特征不符等原因驳回认领，启事重新开放 |

## 本地开发方式

前端：

```bash
cd frontend
npm install
npm run dev
```

后端（依赖 MySQL，可先用 `docker compose up -d db` 启动数据库）：

```bash
cd backend
npm install
npm run dev
```

## 技术栈

| 分层 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript、Element Plus、Vite |
| 后端 | NestJS + TypeScript |
| 数据库 | MySQL 8.0 |
| 认证 | JWT |
| 依赖 | TypeORM、class-validator |

## 项目目录结构

```text
.
├── backend/              # 后端服务
├── database/             # 数据库脚本
├── frontend/             # 前端应用
├── docker-compose.yml    # 一键部署编排
├── .env.example          # 环境变量示例
└── README.md
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| COMPOSE_PROJECT_NAME | Compose 项目名，避免中文目录名导致项目名为空 | lpcampusmarket |
| DB_NAME | 数据库名称 | app |
| DB_USER | 数据库用户 | app |
| DB_PASSWORD | 数据库密码 | app_pwd |
| DB_ROOT_PASSWORD | 数据库 root 密码 | root_pwd |
| JWT_SECRET | JWT 签名密钥 | change_me_to_a_long_random_string |
| FRONTEND_PORT | 前端宿主机端口 | 28514 |
| BACKEND_PORT | 后端宿主机端口 | 29514 |
| DB_PORT | 数据库宿主机端口 | 3306 |

## Docker 部署说明

- 使用 `docker compose up -d` 启动，不需要额外传入 `-p`。
- `docker-compose.yml` 顶层已声明 `name: lpcampusmarket`，并且 `.env` 包含 `COMPOSE_PROJECT_NAME=lpcampusmarket`，可在中文目录名下启动。
- 数据库数据保存在命名卷 `db_data` 中，不依赖当前目录名。
- 前端容器由 Nginx 托管静态资源，并把 `/api/` 反向代理到 `backend:29514`。
- 若本地端口冲突，可修改 `.env` 中的 `FRONTEND_PORT`、`BACKEND_PORT`、`DB_PORT`。

常用命令：

```bash
docker compose config --quiet
docker compose ps
docker compose down
```

## License

MIT
