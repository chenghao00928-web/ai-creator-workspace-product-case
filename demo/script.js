const form = document.querySelector("#analysisForm");
const submitBtn = document.querySelector("#submitBtn");
const clearBtn = document.querySelector("#clearBtn");
const fillExampleBtn = document.querySelector("#fillExampleBtn");
const navExampleBtn = document.querySelector("#navExampleBtn");
const copyBtn = document.querySelector("#copyBtn");
const saveBtn = document.querySelector("#saveBtn");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const errorBox = document.querySelector("#errorBox");
const loadingBox = document.querySelector("#loadingBox");
const resultContent = document.querySelector("#resultContent");
const historyList = document.querySelector("#historyList");
const taskButtons = document.querySelectorAll("[data-task]");
const modelOptions = document.querySelectorAll("[data-model]");
const modeTitle = document.querySelector("#modeTitle");
const modeBadge = document.querySelector("#modeBadge");
const modeDescription = document.querySelector("#modeDescription");
const modeChips = document.querySelector("#modeChips");
const headlineCost = document.querySelector("#headlineCost");
const costNote = document.querySelector("#costNote");
const boardSaved = document.querySelector("#boardSaved");

const STORAGE_KEY = "ai-job-workspace-history";

const sampleResultText = `# AI 求职分析示例
## 匹配度评分
78 / 100。岗位更看重结构化分析、用户洞察、Prompt 设计和把 AI 输出转成可执行文档的能力。
## 能力要求
- 产品分析
- 用户研究
- Prompt 设计
- PRD 写作
## 下一步行动
- 把简历项目描述改成 STAR + 指标。
- 准备 8 个基于项目的追问答案。
- 补齐作品集 PDF 的截图与流程页。`;

let currentResult = sampleResultText;

const example = {
  targetRole: "产品经理实习生",
  jobDescription:
    "岗位职责：参与产品需求分析、竞品调研、用户反馈整理和数据分析；协助设计求职工具类产品功能，推动原型、PRD 和上线验证。任职要求：理解用户需求，有用户研究和数据分析意识，能独立完成产品文档和竞品分析。",
  userBackground:
    "西安交通大学应用统计研一，本科工商管理，目标产品经理实习。具备统计和数据分析基础，正在补充 AI 工具与产品设计理解，已完成 AI 求职工作台作品集，包括竞品分析、用户访谈、PRD、低保真原型和 Token 成本测算。"
};

const taskMeta = {
  jd: {
    title: "JD 解析",
    badge: "岗位理解",
    description: "提取岗位职责、能力关键词和隐性要求，帮助用户先看懂岗位。",
    chips: ["岗位职责", "硬性要求", "隐性能力"]
  },
  resume: {
    title: "简历匹配",
    badge: "差距定位",
    description: "把个人背景和 JD 对齐，识别可强化经历、表达短板和修改方向。",
    chips: ["匹配优势", "能力短板", "改写建议"]
  },
  competitor: {
    title: "竞品分析",
    badge: "产品视角",
    description: "生成 AIGC / MaaS / AI 工具的竞品分析框架，用于作品集补充。",
    chips: ["竞品矩阵", "机会点", "差异化"]
  },
  prd: {
    title: "PRD 初稿",
    badge: "文档沉淀",
    description: "把功能需求转成页面结构、字段、状态、异常和验收标准。",
    chips: ["功能范围", "页面结构", "验收标准"]
  },
  interview: {
    title: "面试问题",
    badge: "面试准备",
    description: "基于 JD 和简历生成个性化追问，覆盖行为题、项目题和产品题。",
    chips: ["高频问题", "项目追问", "回答提纲"]
  },
  qa: {
    title: "输出质检",
    badge: "质量控制",
    description: "检查 AI 输出是否空泛、结构是否完整、建议是否可执行。",
    chips: ["结构完整", "可执行", "避免空话"]
  }
};

const modelMeta = {
  deepseek: {
    cost: "0.0345 RMB",
    note: "DeepSeek V4 Pro 标准任务：2000 input + 1200 output tokens，含成本安全系数。"
  },
  kimi: {
    cost: "0.0580 RMB",
    note: "Kimi 标准任务估算：适合长文本 JD 与简历材料处理。"
  },
  gpt: {
    cost: "0.1242 RMB",
    note: "GPT 标准任务估算：适合结构化输出和复杂文档生成。"
  },
  claude: {
    cost: "0.1460 RMB",
    note: "Claude 标准任务估算：适合长文档摘要、PRD 和分析报告。"
  },
  gemini: {
    cost: "0.0710 RMB",
    note: "Gemini 标准任务估算：适合多模态扩展和轻量分析。"
  }
};

function getFocusAreas() {
  return [...document.querySelectorAll(".checkbox-grid input:checked")].map((item) => item.value);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function setLoading(isLoading) {
  loadingBox.hidden = !isLoading;
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "生成中..." : "生成分析";
}

function fillExample() {
  document.querySelector("#targetRole").value = example.targetRole;
  document.querySelector("#jobDescription").value = example.jobDescription;
  document.querySelector("#userBackground").value = example.userBackground;
  document.querySelector("#demo").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setTask(task) {
  const meta = taskMeta[task] || taskMeta.jd;
  taskButtons.forEach((button) => button.classList.toggle("active", button.dataset.task === task));
  modeTitle.textContent = meta.title;
  modeBadge.textContent = meta.badge;
  modeDescription.textContent = meta.description;
  modeChips.innerHTML = meta.chips.map((chip) => `<span>${chip}</span>`).join("");
}

function setModel(model) {
  const meta = modelMeta[model] || modelMeta.deepseek;
  modelOptions.forEach((button) => button.classList.toggle("active", button.dataset.model === model));
  headlineCost.textContent = meta.cost;
  costNote.textContent = meta.note;
}

function renderMarkdownLike(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = escaped
    .replace(/^### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^## (.*)$/gm, "<h3>$1</h3>")
    .replace(/^# (.*)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");

  return `<div class="generated-markdown"><p>${html}</p></div>`;
}

function renderSampleResult() {
  currentResult = sampleResultText;
  resultContent.classList.remove("empty");
  resultContent.innerHTML = `
    <div class="score-overview">
      <div>
        <span>匹配度评分</span>
        <strong>78</strong>
        <em>/ 100</em>
      </div>
      <p>岗位更看重结构化分析、用户洞察、Prompt 设计和把 AI 输出转成可执行文档的能力。</p>
    </div>
    <div class="output-grid">
      <section>
        <h3>能力要求</h3>
        <div class="tag-list">
          <span>产品分析</span>
          <span>用户研究</span>
          <span>Prompt 设计</span>
          <span>PRD 写作</span>
        </div>
      </section>
      <section>
        <h3>匹配优势</h3>
        <ul>
          <li>已有 AI 求职工作台项目，可对应岗位中的文档协作与流程优化。</li>
          <li>统计背景可支撑用户反馈归类、指标设计和效果评估。</li>
        </ul>
      </section>
      <section>
        <h3>能力短板</h3>
        <ul>
          <li>需要把项目经历写成更明确的输入、处理、输出链路。</li>
          <li>补充真实竞品拆解和成本测算结论。</li>
        </ul>
      </section>
      <section>
        <h3>下一步行动</h3>
        <ol>
          <li>把简历项目描述改成 STAR + 指标。</li>
          <li>准备 8 个基于项目的追问答案。</li>
          <li>补齐作品集 PDF 的截图与流程页。</li>
        </ol>
      </section>
    </div>
  `;
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (_error) {
    return [];
  }
}

function writeHistory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 10)));
}

function updateBoard() {
  const count = readHistory().length;
  boardSaved.textContent = String(count);
}

function renderHistory() {
  const items = readHistory();
  historyList.innerHTML = "";
  updateBoard();

  if (!items.length) {
    historyList.innerHTML = `
      <div class="history-empty">
        <p class="history-meta">暂无保存结果。生成后可归档到本地，适合按投递岗位沉淀。</p>
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "history-item";
    wrapper.innerHTML = `
      <p class="history-title">${item.targetRole}</p>
      <p class="history-meta">${item.createdAt}</p>
      <button type="button" class="ghost-button small" data-index="${index}">查看</button>
    `;
    historyList.appendChild(wrapper);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  setLoading(true);

  const payload = {
    targetRole: document.querySelector("#targetRole").value.trim(),
    jobDescription: document.querySelector("#jobDescription").value.trim(),
    userBackground: document.querySelector("#userBackground").value.trim(),
    focusAreas: getFocusAreas()
  };

  try {
    const response = await fetch("/api/analyze-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "生成失败，请稍后重试。");
    }

    currentResult = data.result;
    resultContent.classList.remove("empty");
    resultContent.innerHTML = renderMarkdownLike(currentResult);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
});

clearBtn.addEventListener("click", () => {
  form.reset();
  document.querySelectorAll(".checkbox-grid input").forEach((item, index) => {
    item.checked = [0, 1, 4].includes(index);
  });
  hideError();
  renderSampleResult();
});

fillExampleBtn.addEventListener("click", fillExample);
navExampleBtn?.addEventListener("click", fillExample);

taskButtons.forEach((button) => {
  button.addEventListener("click", () => setTask(button.dataset.task));
});

modelOptions.forEach((button) => {
  button.addEventListener("click", () => setModel(button.dataset.model));
});

copyBtn.addEventListener("click", async () => {
  if (!currentResult) {
    showError("当前没有可复制的分析结果。");
    return;
  }

  await navigator.clipboard.writeText(currentResult);
  copyBtn.textContent = "已复制";
  setTimeout(() => {
    copyBtn.textContent = "复制";
  }, 1200);
});

saveBtn.addEventListener("click", () => {
  if (!currentResult) {
    showError("当前没有可保存的分析结果。");
    return;
  }

  const targetRole = document.querySelector("#targetRole").value.trim() || "示例岗位分析";
  const history = readHistory();
  history.unshift({
    targetRole,
    result: currentResult,
    createdAt: new Date().toLocaleString()
  });
  writeHistory(history);
  renderHistory();
});

historyList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;

  const item = readHistory()[Number(button.dataset.index)];
  if (!item) return;

  currentResult = item.result;
  resultContent.classList.remove("empty");
  resultContent.innerHTML = renderMarkdownLike(currentResult);
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

renderHistory();
