#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";

const DEFAULT_API_URL = process.env.ANALYZE_JD_API_URL || "http://localhost:3000/api/analyze-jd";
const DEFAULT_OUTPUT_DIR = "outputs/jd-analysis";

function printHelp() {
  console.log(`Batch JD analysis

Usage:
  node scripts/batch-jd-analysis.js --input examples/batch-jd-analysis.json

Options:
  --input <file>       JSON file with an array of JD analysis items.
  --output <dir>       Output directory. Defaults to ${DEFAULT_OUTPUT_DIR}.
  --api-url <url>      API endpoint. Defaults to ${DEFAULT_API_URL}.
  --dry-run            Validate input and print planned tasks without calling API.
  --help               Show this help.

Input item fields:
  id, company, targetRole, jobDescription, userBackground, focusAreas
`);
}

function parseArgs(argv) {
  const args = {
    input: "",
    output: DEFAULT_OUTPUT_DIR,
    apiUrl: DEFAULT_API_URL,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--input") args.input = argv[++index] || "";
    else if (arg === "--output") args.output = argv[++index] || DEFAULT_OUTPUT_DIR;
    else if (arg === "--api-url") args.apiUrl = argv[++index] || DEFAULT_API_URL;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "jd-analysis";
}

function validateItem(item, index) {
  const targetRole = normalizeText(item.targetRole);
  const jobDescription = normalizeText(item.jobDescription);
  const userBackground = normalizeText(item.userBackground);

  if (!targetRole || !jobDescription || !userBackground) {
    throw new Error(`Item ${index + 1} is missing targetRole, jobDescription, or userBackground.`);
  }

  return {
    id: normalizeText(item.id) || `item-${index + 1}`,
    company: normalizeText(item.company),
    targetRole,
    jobDescription,
    userBackground,
    focusAreas: Array.isArray(item.focusAreas) && item.focusAreas.length
      ? item.focusAreas.map((area) => normalizeText(area)).filter(Boolean)
      : ["岗位职责", "能力关键词", "能力差距", "简历改写建议", "面试问题"]
  };
}

async function readInput(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error("Input JSON must be an array.");
  }
  return parsed.map(validateItem);
}

async function analyzeItem(item, apiUrl) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetRole: item.company ? `${item.company} ${item.targetRole}` : item.targetRole,
      jobDescription: item.jobDescription,
      userBackground: item.userBackground,
      focusAreas: item.focusAreas
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

function renderMarkdown(item, data) {
  return `# ${item.company ? `${item.company} ` : ""}${item.targetRole} 分析结果

## 输入信息

- 公司：${item.company || "未填写"}
- 目标岗位：${item.targetRole}
- 输出重点：${item.focusAreas.join("、")}
- 模型：${data.model || "unknown"}

## AI 分析结果

${data.result}

## Usage

\`\`\`json
${JSON.stringify(data.usage || null, null, 2)}
\`\`\`
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (!args.input) {
    throw new Error("Missing --input. Run with --help for usage.");
  }

  const items = await readInput(args.input);

  if (args.dryRun) {
    console.log(`Validated ${items.length} item(s).`);
    items.forEach((item) => {
      console.log(`- ${item.id}: ${item.company ? `${item.company} ` : ""}${item.targetRole}`);
    });
    return;
  }

  await fs.mkdir(args.output, { recursive: true });

  for (const item of items) {
    console.log(`Analyzing ${item.id}: ${item.company ? `${item.company} ` : ""}${item.targetRole}`);
    const data = await analyzeItem(item, args.apiUrl);
    const filename = `${slugify(`${item.id}-${item.company}-${item.targetRole}`)}.md`;
    const outputPath = path.join(args.output, filename);
    await fs.writeFile(outputPath, renderMarkdown(item, data), "utf8");
    console.log(`Saved ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
