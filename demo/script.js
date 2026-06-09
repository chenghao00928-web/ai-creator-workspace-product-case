const form = document.querySelector("#analysisForm");
const submitBtn = document.querySelector("#submitBtn");
const clearBtn = document.querySelector("#clearBtn");
const copyBtn = document.querySelector("#copyBtn");
const saveBtn = document.querySelector("#saveBtn");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const errorBox = document.querySelector("#errorBox");
const loadingBox = document.querySelector("#loadingBox");
const resultContent = document.querySelector("#resultContent");
const historyList = document.querySelector("#historyList");
const taskButtons = document.querySelectorAll("[data-task]");
const modelOptions = document.querySelectorAll("[data-model]");
const focusInputs = document.querySelectorAll(".checkbox-grid input");

const targetRoleInput = document.querySelector("#targetRole");
const jobDescriptionInput = document.querySelector("#jobDescription");
const userBackgroundInput = document.querySelector("#userBackground");

const modeTitle = document.querySelector("#modeTitle");
const modeBadge = document.querySelector("#modeBadge");
const modeDescription = document.querySelector("#modeDescription");
const modeChips = document.querySelector("#modeChips");

const metricTextChars = document.querySelector("#metricTextChars");
const metricBgChars = document.querySelector("#metricBgChars");
const metricModuleCount = document.querySelector("#metricModuleCount");
const headlineCost = document.querySelector("#headlineCost");
const headlineModel = document.querySelector("#headlineModel");
const sideTextChars = document.querySelector("#sideTextChars");
const sideBgChars = document.querySelector("#sideBgChars");
const sideModuleCount = document.querySelector("#sideModuleCount");
const costNote = document.querySelector("#costNote");
const boardSaved = document.querySelector("#boardSaved");
const boardCompleteness = document.querySelector("#boardCompleteness");
const boardCompletenessText = document.querySelector("#boardCompletenessText");
const boardMissing = document.querySelector("#boardMissing");
const boardMissingText = document.querySelector("#boardMissingText");
const boardResultReady = document.querySelector("#boardResultReady");
const boardResultText = document.querySelector("#boardResultText");
const taskChecklist = document.querySelector("#taskChecklist");

const STORAGE_KEY = "ai-analysis-workspace-history";

let currentResult = "";
let currentModel = "deepseek";
let hasGeneratedResult = false;

const taskMeta = {
  text: {
    title: "需求解析",
    badge: "信息拆解",
    focusValue: "需求解析",
    description: "提取原始文本中的目标、约束、关键信息和隐性要求。",
    chips: ["目标拆解", "关键约束", "隐性要求"]
  },
  background: {
    title: "背景匹配",
    badge: "匹配分析",
    focusValue: "背景匹配",
    description: "把背景信息与需求文本对齐，识别优势、缺口和补充方向。",
    chips: ["匹配优势", "信息缺口", "补充建议"]
  },
  competitor: {
    title: "竞品分析",
    badge: "产品视角",
    focusValue: "竞品分析",
    description: "基于分析对象补充可展示的竞品分析框架和机会点。",
    chips: ["竞品矩阵", "机会点", "差异化"]
  },
  prd: {
    title: "PRD 初稿",
    badge: "文档沉淀",
    focusValue: "PRD 初稿",
    description: "把功能需求转成页面结构、字段、状态、异常和验收标准。",
    chips: ["功能范围", "页面结构", "验收标准"]
  },
  action: {
    title: "行动清单",
    badge: "下一步",
    focusValue: "行动清单",
    description: "基于当前分析结果生成下一步行动、验证任务和补充材料清单。",
    chips: ["待验证", "待补充", "优先级"]
  },
  qa: {
    title: "输出质检",
    badge: "质量控制",
    focusValue: "输出质量检查",
    description: "检查 AI 输出是否空泛、结构是否完整、建议是否可执行。",
    chips: ["结构完整", "可执行", "避免空话"]
  }
};

const modelMeta = {
  deepseek: {
    label: "DeepSeek",
    standardCost: 0.0345,
    note: "按当前文本、背景信息和输出模块数量估算。实际费用会受模型、重试、输出长度影响。"
  },
  kimi: {
    label: "Kimi",
    standardCost: 0.058,
    note: "适合长文本资料处理，当前费用按输入规模动态估算。"
  },
  gpt: {
    label: "GPT",
    standardCost: 0.1242,
    note: "适合结构化输出和复杂文档生成，当前费用按输入规模动态估算。"
  },
  claude: {
    label: "Claude",
    standardCost: 0.146,
    note: "适合长文档摘要、PRD 和分析报告，当前费用按输入规模动态估算。"
  },
  gemini: {
    label: "Gemini",
    standardCost: 0.071,
    note: "适合后续多模态扩展，当前费用按输入规模动态估算。"
  }
};

function getFocusAreas() {
  return [...focusInputs].filter((item) => item.checked).map((item) => item.value);
}

function getPlainLength(value) {
  return value.replace(/\s+/g, "").length;
}

function estimateCost() {
  const textChars = getPlainLength(jobDescriptionInput.value);
  const bgChars = getPlainLength(userBackgroundInput.value);
  const moduleCount = getFocusAreas().length || 1;
  if (textChars + bgChars === 0) return 0;
  const estimatedTokens = Math.ceil((textChars + bgChars) * 0.75 + moduleCount * 420);
  const normalizedTaskCount = Math.max(estimatedTokens / 3200, 0);
  return modelMeta[currentModel].standardCost * normalizedTaskCount;
}

function updateWorkspaceState() {
  const targetFilled = Boolean(targetRoleInput.value.trim());
  const textChars = getPlainLength(jobDescriptionInput.value);
  const bgChars = getPlainLength(userBackgroundInput.value);
  const selectedModules = getFocusAreas();
  const missingItems = [];

  if (!targetFilled) missingItems.push("分析对象");
  if (!textChars) missingItems.push("需求文本");
  if (!bgChars) missingItems.push("背景信息");

  const completeness = Math.round(((3 - missingItems.length) / 3) * 100);
  const cost = estimateCost();

  metricTextChars.textContent = `${textChars} 字`;
  metricBgChars.textContent = `${bgChars} 字`;
  metricModuleCount.textContent = `${selectedModules.length} 项`;
  headlineCost.textContent = `${cost.toFixed(4)} RMB`;
  headlineModel.textContent = modelMeta[currentModel].label;
  sideTextChars.textContent = String(textChars);
  sideBgChars.textContent = String(bgChars);
  sideModuleCount.textContent = String(selectedModules.length);
  boardCompleteness.textContent = `${completeness}%`;
  boardCompletenessText.textContent = completeness === 100 ? "可以生成分析" : "还需要补充输入";
  boardMissing.textContent = String(missingItems.length);
  boardMissingText.textContent = missingItems.length ? missingItems.join("、") : "输入已完整";
  boardResultReady.textContent = hasGeneratedResult ? "1" : "0";
  boardResultText.textContent = hasGeneratedResult ? "已有可复制/保存结果" : "尚未生成";

  taskChecklist.innerHTML = [...focusInputs]
    .map((item) => {
      const checkedClass = item.checked ? "checked" : "";
      const state = item.checked ? "已选" : "未选";
      return `<span class="${checkedClass}"><b>${item.value}</b><em>${state}</em></span>`;
    })
    .join("");
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

function setTask(task) {
  const meta = taskMeta[task] || taskMeta.text;
  taskButtons.forEach((button) => button.classList.toggle("active", button.dataset.task === task));
  modeTitle.textContent = meta.title;
  modeBadge.textContent = meta.badge;
  modeDescription.textContent = meta.description;
  modeChips.innerHTML = meta.chips.map((chip) => `<span>${chip}</span>`).join("");

  const matchedInput = [...focusInputs].find((item) => item.value === meta.focusValue);
  if (matchedInput) matchedInput.checked = true;
  updateWorkspaceState();
}

function setModel(model) {
  currentModel = modelMeta[model] ? model : "deepseek";
  modelOptions.forEach((button) => button.classList.toggle("active", button.dataset.model === currentModel));
  costNote.textContent = modelMeta[currentModel].note;
  updateWorkspaceState();
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

function renderEmptyResult() {
  hasGeneratedResult = false;
  currentResult = "";
  resultContent.classList.add("empty");
  resultContent.innerHTML = `
    <div class="empty-state">
      <h3>等待生成结果</h3>
      <p>填写需求文本和背景信息后点击“生成分析”，这里会展示真实接口返回的分析内容。</p>
    </div>
  `;
  updateWorkspaceState();
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

function updateSavedCount() {
  boardSaved.textContent = String(readHistory().length);
}

function renderHistory() {
  const items = readHistory();
  historyList.innerHTML = "";
  updateSavedCount();

  if (!items.length) {
    historyList.innerHTML = `
      <div class="history-empty">
        <p class="history-meta">暂无保存结果。生成后可归档到本地，便于按项目或主题沉淀。</p>
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
    targetRole: targetRoleInput.value.trim(),
    jobDescription: jobDescriptionInput.value.trim(),
    userBackground: userBackgroundInput.value.trim(),
    focusAreas: getFocusAreas()
  };

  try {
    const response = await fetch("/api/analyze-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "生成失败，请稍后重试。");
    }

    currentResult = data.result;
    hasGeneratedResult = true;
    resultContent.classList.remove("empty");
    resultContent.innerHTML = renderMarkdownLike(currentResult);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
    updateWorkspaceState();
  }
});

clearBtn.addEventListener("click", () => {
  form.reset();
  focusInputs.forEach((item, index) => {
    item.checked = [0, 1, 4].includes(index);
  });
  hideError();
  renderEmptyResult();
});

taskButtons.forEach((button) => {
  button.addEventListener("click", () => setTask(button.dataset.task));
});

modelOptions.forEach((button) => {
  button.addEventListener("click", () => setModel(button.dataset.model));
});

[targetRoleInput, jobDescriptionInput, userBackgroundInput, ...focusInputs].forEach((item) => {
  item.addEventListener("input", updateWorkspaceState);
  item.addEventListener("change", updateWorkspaceState);
});

copyBtn.addEventListener("click", async () => {
  if (!currentResult) {
    showError("当前没有可复制的分析结果。请先生成分析。");
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
    showError("当前没有可保存的分析结果。请先生成分析。");
    return;
  }

  const targetRole = targetRoleInput.value.trim() || "未命名分析";
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
  hasGeneratedResult = true;
  resultContent.classList.remove("empty");
  resultContent.innerHTML = renderMarkdownLike(currentResult);
  updateWorkspaceState();
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

setModel(currentModel);
renderHistory();
renderEmptyResult();
