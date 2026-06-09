const form = document.querySelector("#analysisForm");
const submitBtn = document.querySelector("#submitBtn");
const clearBtn = document.querySelector("#clearBtn");
const fillExampleBtn = document.querySelector("#fillExampleBtn");
const copyBtn = document.querySelector("#copyBtn");
const saveBtn = document.querySelector("#saveBtn");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const errorBox = document.querySelector("#errorBox");
const loadingBox = document.querySelector("#loadingBox");
const resultContent = document.querySelector("#resultContent");
const historyList = document.querySelector("#historyList");

const STORAGE_KEY = "ai-job-workspace-history";
let currentResult = "";

const example = {
  targetRole: "AI 产品经理实习生",
  jobDescription:
    "岗位职责：参与 AI 产品需求分析、竞品调研、Prompt 设计、用户反馈整理和数据分析；协助设计 AI 助手类产品功能，推动原型、PRD 和上线验证。任职要求：了解大模型产品，有用户研究和数据分析意识，能独立完成产品文档和竞品分析。",
  userBackground:
    "西安交通大学应用统计研一，本科工商管理，目标 AI 产品经理实习。具备统计和数据分析基础，正在补充 AIGC 产品理解，已完成 AI 创作助手工作台作品集，包括竞品分析、用户访谈、PRD、低保真原型和 Token 成本测算。"
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

function renderMarkdownLike(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/^### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^## (.*)$/gm, "<h3>$1</h3>")
    .replace(/^# (.*)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
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

function renderHistory() {
  const items = readHistory();
  historyList.innerHTML = "";

  if (!items.length) {
    historyList.innerHTML = `
      <p class="history-meta">暂无历史记录，生成结果后可保存到本地。</p>
      <p class="history-meta">建议按岗位保存，后续可以扩展为投递看板。</p>
      <p class="history-meta">当前使用 localStorage 做轻量验证。</p>
    `;
    return;
  }

  items.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "history-item";
    wrapper.innerHTML = `
      <p class="history-title">${item.targetRole}</p>
      <p class="history-meta">${item.createdAt}</p>
      <button type="button" class="ghost-button" data-index="${index}">查看结果</button>
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
  document.querySelectorAll(".checkbox-grid input").forEach((item) => {
    item.checked = true;
  });
  currentResult = "";
  resultContent.classList.add("empty");
  resultContent.innerHTML = `
    <h3>等待生成</h3>
    <p>填写左侧信息后，结果将展示在这里。</p>
    <div class="empty-grid">
      <span>岗位核心职责</span>
      <span>能力关键词</span>
      <span>能力匹配度</span>
      <span>能力差距</span>
      <span>简历改写建议</span>
      <span>面试准备问题</span>
      <span>下一步学习建议</span>
    </div>
  `;
  hideError();
});

fillExampleBtn.addEventListener("click", () => {
  document.querySelector("#targetRole").value = example.targetRole;
  document.querySelector("#jobDescription").value = example.jobDescription;
  document.querySelector("#userBackground").value = example.userBackground;
});

copyBtn.addEventListener("click", async () => {
  if (!currentResult) {
    showError("当前没有可复制的分析结果。");
    return;
  }

  await navigator.clipboard.writeText(currentResult);
  copyBtn.textContent = "已复制";
  setTimeout(() => {
    copyBtn.textContent = "复制结果";
  }, 1200);
});

saveBtn.addEventListener("click", () => {
  if (!currentResult) {
    showError("当前没有可保存的分析结果。");
    return;
  }

  const targetRole = document.querySelector("#targetRole").value.trim() || "未命名岗位分析";
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
