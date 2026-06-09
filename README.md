# AIGC 竞品分析与 AI 信息分析工作台 Demo

## 1. 项目定位

本项目是一个 AIGC 产品分析与可运行 Demo 项目，重点展示从竞品研究、用户需求洞察、产品方案设计、前后端 Demo、Token 成本测算到 PDF 交付物生成的完整产品工作链路。

项目围绕豆包、Kimi、通义千问、即梦 AI、ChatGPT、Claude、Gemini 等国内外 AIGC 产品展开竞品分析，重点拆解 Prompt 引导、生成结果编辑、历史管理、多模态能力、工作流闭环和会员商业化策略。

在竞品分析和用户研究基础上，项目设计了一个 **AI 信息分析工作台 MVP**，用于把非结构化资料转成结构化分析结果，支持需求解析、背景匹配、竞品分析、PRD 初稿、行动清单和输出质量检查。

## 2. 项目亮点

- **AIGC 竞品分析**：覆盖国内外主流 AI 产品，比较产品定位、交互、工作流和商业化。
- **用户需求洞察**：围绕创作、办公、教育和资料处理场景，提炼高频任务与输出痛点。
- **AI 信息分析工作台 MVP**：将通用聊天式生成收敛为结构化输入、任务化处理和可复用输出。
- **大模型 API 接入 Demo**：使用 Node.js + Express + OpenAI SDK 调用 DeepSeek API。
- **Token 成本与商业化**：测算单次任务成本，比较不同模型在标准分析任务下的成本差异。
- **PDF 自动生成**：使用脚本将 PRD 摘要和项目展示内容排版为 16:9 PDF。

## 3. 核心用户与场景

| 用户类型 | 核心任务 | 项目方案 |
|---|---|---|
| 内容创作用户 | 拆解选题、脚本、账号资料 | 结构化分析与多版本输出 |
| 运营 / 产品用户 | 整理需求、竞品、用户反馈 | 需求解析、PRD 初稿、输出质检 |
| 教育 / 知识管理用户 | 总结资料、形成学习或研究框架 | 资料分析、背景匹配、行动清单 |
| 个人项目用户 | 沉淀项目资料和分析结果 | 本地历史、模型成本、PDF 交付物 |

## 4. 项目结构

```text
ai-creator-workspace-product-case/
├── docs/          # 竞品分析、用户研究、产品报告、API 接入、商业化
├── data/          # Token 成本测算表
├── demo/          # AI 信息分析工作台前端 Demo
├── server/        # Node.js + Express 后端接口
├── scripts/       # PDF 自动生成脚本
├── prototype/     # 低保真原型设计
└── assets/        # 截图和素材
```

## 5. Demo 运行方式

![AI 信息分析工作台 Demo 首页](assets/demo-workspace-home.png)

### 5.1 安装依赖

```bash
cd server
npm install
```

### 5.2 配置环境变量

在项目根目录复制 `.env.example` 为 `.env`：

```bash
copy .env.example .env
```

然后填写真实 Key：

```text
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=3000
```

注意：不要提交真实 `.env` 文件，API Key 只在服务端读取。

### 5.3 启动服务

```bash
cd server
npm run dev
```

打开浏览器：

```text
http://localhost:3000
```

## 6. API 说明

接口：

```text
POST /api/analyze-text
```

请求示例：

```json
{
  "targetRole": "AIGC 内容生成工具",
  "jobDescription": "需要分析的一段需求文本、产品资料或用户反馈...",
  "userBackground": "项目背景、目标用户、已有方案和约束条件...",
  "focusAreas": ["需求解析", "背景匹配", "行动清单"]
}
```

后端使用 OpenAI SDK 调用 DeepSeek OpenAI-compatible API，默认模型为 `deepseek-v4-flash`，可通过 `DEEPSEEK_MODEL` 调整。

## 7. PDF 交付物

- [AI 信息分析工作台 PRD 摘要 PDF](docs/ai-analysis-workspace-prd.pdf)
- [AI 信息分析工作台项目展示 PDF](docs/ai-analysis-workspace-portfolio.pdf)

## 8. 已完成产出

- [AIGC 竞品分析](docs/competitor-analysis.md)
- [国内外 AIGC 产品体验与产品策略对比](docs/domestic-vs-global-ai-products.md)
- [用户研究](docs/user-research.md)
- [迭代优先级](docs/iteration-plan.md)
- [产品方案报告](docs/product-report.md)
- [Prompt 设计说明](docs/prompt-design.md)
- [大模型 API 接入说明](docs/api-integration.md)
- [Prompt 模板库](docs/prompt-template-library.md)
- [商业化分析](docs/commercialization.md)
- [AI 信息分析工作台 PRD 摘要 PDF](docs/ai-analysis-workspace-prd.pdf)
- [AI 信息分析工作台项目展示 PDF](docs/ai-analysis-workspace-portfolio.pdf)
