import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const PORT = process.env.PORT || 3000;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const MAX_TEXT_LENGTH = 12000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.resolve(__dirname, "..", "demo")));

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validatePayload(payload) {
  const targetRole = normalizeText(payload.targetRole);
  const jobDescription = normalizeText(payload.jobDescription);
  const userBackground = normalizeText(payload.userBackground);
  const focusAreas = Array.isArray(payload.focusAreas)
    ? payload.focusAreas.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];

  if (!targetRole || !jobDescription || !userBackground) {
    return {
      error: "请填写分析对象、需求文本和背景信息后再生成分析。"
    };
  }

  if (
    targetRole.length > MAX_TEXT_LENGTH ||
    jobDescription.length > MAX_TEXT_LENGTH ||
    userBackground.length > MAX_TEXT_LENGTH
  ) {
    return {
      error: "输入内容过长，请精简需求文本或背景信息后重试。"
    };
  }

  return {
    data: {
      targetRole,
      jobDescription,
      userBackground,
      focusAreas: focusAreas.length ? focusAreas : ["需求解析", "背景匹配", "竞品分析", "PRD 初稿", "行动清单", "输出质量检查"]
    }
  };
}

const systemPrompt = `你是一名 AI 产品分析助手，擅长分析需求文本、拆解业务目标、识别信息缺口，并结合背景资料给出结构化建议。
你的回答必须结构化、具体、可执行，避免空泛表达。
不要编造用户没有提供的信息。如果信息不足，请明确说明需要补充的信息。
输出必须使用 Markdown，并固定包含以下 8 个部分：
1. 核心目标
2. 关键信息
3. 背景匹配分析
4. 信息缺口
5. 方案建议
6. 可追问问题
7. 下一步行动清单
8. 风险提示`;

function buildUserPrompt({ targetRole, jobDescription, userBackground, focusAreas }) {
  return `请分析以下信息，并重点关注：${focusAreas.join("、")}。

分析对象：
${targetRole}

需求文本：
${jobDescription}

背景信息：
${userBackground}

请输出结构化、具体、可执行的分析结果。方案建议需要包含判断依据、可执行动作和必要的补充信息；可追问问题需要帮助用户继续澄清需求、验证方案和完善材料。`;
}

app.post("/api/analyze-text", async (req, res) => {
  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({
      error: "服务端未配置 DEEPSEEK_API_KEY，请在 .env 中配置后重启服务。"
    });
  }

  const validation = validatePayload(req.body || {});
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY
  });

  try {
    const completion = await openai.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(validation.data) }
      ],
      temperature: 0.4,
      max_tokens: 2200,
      stream: false
    });

    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(502).json({
        error: "模型返回内容为空，请稍后重试或调整输入内容。"
      });
    }

    return res.json({
      result: content,
      model: DEEPSEEK_MODEL,
      usage: completion.usage || null
    });
  } catch (error) {
    console.error("DeepSeek API request failed:", error);
    return res.status(502).json({
      error: "大模型请求失败，请检查 API Key、网络连接或模型配置。"
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model: DEEPSEEK_MODEL,
    hasApiKey: Boolean(process.env.DEEPSEEK_API_KEY)
  });
});

app.listen(PORT, () => {
  console.log(`AI 信息分析工作台 Demo server running at http://localhost:${PORT}`);
});
