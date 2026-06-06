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
      error: "请填写目标岗位、岗位 JD 和个人背景后再生成分析。"
    };
  }

  if (
    targetRole.length > MAX_TEXT_LENGTH ||
    jobDescription.length > MAX_TEXT_LENGTH ||
    userBackground.length > MAX_TEXT_LENGTH
  ) {
    return {
      error: "输入内容过长，请精简岗位 JD 或个人背景后重试。"
    };
  }

  return {
    data: {
      targetRole,
      jobDescription,
      userBackground,
      focusAreas: focusAreas.length ? focusAreas : ["岗位职责", "能力关键词", "能力差距", "简历改写建议", "面试问题"]
    }
  };
}

const systemPrompt = `你是一名 AI 产品经理求职辅导助手，擅长分析实习岗位 JD、拆解岗位能力要求，并结合用户背景给出简历优化和面试准备建议。
你的回答必须结构化、具体、可执行，避免空泛表达。
不要编造用户没有提供的经历。如果信息不足，请明确说明需要补充的信息。
输出必须使用 Markdown，并固定包含以下 8 个部分：
1. 岗位核心职责
2. 能力关键词
3. 用户背景匹配分析
4. 能力差距
5. 简历改写建议
6. 面试可能问题
7. 下一步学习建议
8. 风险提示`;

function buildUserPrompt({ targetRole, jobDescription, userBackground, focusAreas }) {
  return `请分析以下求职信息，并重点关注：${focusAreas.join("、")}。

目标岗位：
${targetRole}

岗位 JD：
${jobDescription}

用户背景：
${userBackground}

请输出结构化、具体、可执行的求职分析。简历改写建议需要包含改写方向和示例表达；面试问题需要覆盖 AI 产品理解、用户研究、数据分析、项目经历和岗位匹配。`;
}

app.post("/api/analyze-jd", async (req, res) => {
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
  console.log(`AI 求职工作台 Demo server running at http://localhost:${PORT}`);
});
