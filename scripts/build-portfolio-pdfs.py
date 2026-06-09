from __future__ import annotations

import html
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "outputs" / "pdf-build"
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def chips(items: list[str]) -> str:
    return "".join(f"<span class='chip'>{esc(item)}</span>" for item in items)


def bullets(items: list[str]) -> str:
    return "<ul>" + "".join(f"<li>{esc(item)}</li>" for item in items) + "</ul>"


def cards(items: list[tuple[str, str]], cls: str = "") -> str:
    return (
        f"<div class='card-grid {cls}'>"
        + "".join(f"<article class='card'><h3>{esc(title)}</h3><p>{esc(body)}</p></article>" for title, body in items)
        + "</div>"
    )


def table(headers: list[str], rows: list[list[str]]) -> str:
    head = "".join(f"<th>{esc(item)}</th>" for item in headers)
    body = "".join("<tr>" + "".join(f"<td>{esc(cell)}</td>" for cell in row) + "</tr>" for row in rows)
    return f"<table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>"


STYLE = """
@page { size: 297mm 167mm; margin: 0; }
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #e9eef7;
  color: #172033;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
}
.page {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  width: 297mm;
  height: 167mm;
  padding: 9mm 12mm 8mm;
  page-break-after: always;
  background: #f8fafc;
  overflow: hidden;
}
.cover {
  grid-template-rows: 1fr auto;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.10)),
    #ffffff;
}
.header, .footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10mm;
}
.header {
  padding-bottom: 4mm;
  border-bottom: 1px solid #d9e2ef;
}
.footer {
  padding-top: 3mm;
  color: #667085;
  font-size: 8.5pt;
}
.section {
  color: #2563eb;
  font-size: 8.5pt;
  font-weight: 900;
  letter-spacing: 0;
}
.page-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 10mm;
  height: 6mm;
  border-radius: 99px;
  background: #eef4ff;
  color: #2563eb;
  font-weight: 900;
}
h1, h2, h3, p { margin-top: 0; }
h1 {
  margin-bottom: 5mm;
  color: #101828;
  font-size: 29pt;
  line-height: 1.12;
  letter-spacing: 0;
}
h2 {
  margin: 0;
  color: #101828;
  font-size: 20pt;
  line-height: 1.18;
  letter-spacing: 0;
}
h3 {
  margin: 0 0 2.5mm;
  color: #172033;
  font-size: 11pt;
  line-height: 1.35;
  letter-spacing: 0;
}
p, li, td, th {
  color: #344054;
  font-size: 9.2pt;
  line-height: 1.55;
}
p { margin-bottom: 3mm; }
ul { margin: 0; padding-left: 5mm; }
li { margin-bottom: 1.7mm; }
.content {
  display: grid;
  align-content: start;
  gap: 3.4mm;
  padding-top: 4mm;
}
.cover .content {
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  padding-top: 0;
}
.subtitle {
  max-width: 120mm;
  color: #475467;
  font-size: 12pt;
  line-height: 1.75;
}
.cover-panel {
  display: grid;
  gap: 4mm;
  padding: 7mm;
  border: 1px solid #d9e2ef;
  border-radius: 5mm;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}
.big-number-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4mm;
}
.big-number {
  padding: 5mm;
  border: 1px solid #d9e2ef;
  border-radius: 3mm;
  background: #fff;
}
.big-number strong {
  display: block;
  color: #2563eb;
  font-size: 23pt;
  line-height: 1;
}
.big-number span {
  display: block;
  margin-top: 2mm;
  color: #667085;
  font-size: 8.5pt;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3.2mm;
}
.card-grid.two { grid-template-columns: repeat(2, 1fr); }
.card-grid.four { grid-template-columns: repeat(4, 1fr); }
.card {
  min-height: 0;
  padding: 4mm;
  border: 1px solid #d9e2ef;
  border-radius: 3mm;
  background: #fff;
}
.card p { margin-bottom: 0; }
.split {
  display: grid;
  grid-template-columns: 0.72fr 1.28fr;
  gap: 5mm;
}
.stack {
  display: grid;
  gap: 4mm;
}
.note {
  padding: 4mm 5mm;
  border-left: 1.4mm solid #2563eb;
  border-radius: 3mm;
  background: #eef4ff;
  color: #1f2a44;
  font-weight: 800;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2.5mm;
}
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 7mm;
  padding: 0 3mm;
  border-radius: 999px;
  background: #eef4ff;
  color: #2563eb;
  font-size: 8.5pt;
  font-weight: 900;
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid #d9e2ef;
  border-radius: 3mm;
  background: #fff;
}
th, td {
  padding: 3mm;
  border-right: 1px solid #d9e2ef;
  border-bottom: 1px solid #d9e2ef;
  text-align: left;
  vertical-align: top;
}
th {
  background: #eef4ff;
  color: #172033;
  font-weight: 900;
}
tr:last-child td { border-bottom: 0; }
th:last-child, td:last-child { border-right: 0; }
.flow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4mm;
}
.flow article {
  position: relative;
  padding: 5mm;
  border: 1px solid #d9e2ef;
  border-radius: 3mm;
  background: #fff;
}
.flow article span {
  display: inline-flex;
  margin-bottom: 3mm;
  color: #2563eb;
  font-weight: 900;
}
.screenshot {
  width: 100%;
  height: 91mm;
  object-fit: cover;
  object-position: top left;
  border: 1px solid #d9e2ef;
  border-radius: 3mm;
  background: #fff;
}
.takeaway {
  padding: 3.5mm 4mm;
  border-radius: 3mm;
  background: #101828;
  color: #fff;
  font-size: 9.2pt;
  font-weight: 800;
}
"""


def page(title: str, section: str, number: int, content: str, takeaway: str = "") -> str:
    return f"""
    <section class="page" id="page-{number}">
      <header class="header">
        <span class="section">{esc(section)}</span>
        <h2>{esc(title)}</h2>
      </header>
      <main class="content">{content}</main>
      <footer class="footer">
        <span>{esc(takeaway)}</span>
        <span class="page-no">{number:02d}</span>
      </footer>
    </section>
    """


def cover(title: str, subtitle: str, tags: list[str], numbers: list[tuple[str, str]], number: int) -> str:
    return f"""
    <section class="page cover" id="page-{number}">
      <main class="content">
        <div>
          <p class="section">AI JOB WORKSPACE</p>
          <h1>{esc(title)}</h1>
          <p class="subtitle">{esc(subtitle)}</p>
          <div class="chip-row">{chips(tags)}</div>
        </div>
        <aside class="cover-panel">
          <div class="big-number-grid">
            {''.join(f"<div class='big-number'><strong>{esc(num)}</strong><span>{esc(label)}</span></div>" for num, label in numbers)}
          </div>
          <p class="note">目标：把“看不懂岗位要求”转成“知道差距、能改简历、能准备面试”的结构化求职方案。</p>
        </aside>
      </main>
      <footer class="footer">
        <span>GitHub: chenghao00928-web / ai-creator-workspace-product-case</span>
        <span class="page-no">{number:02d}</span>
      </footer>
    </section>
    """


def html_doc(title: str, pages: list[str]) -> str:
    return f"<!doctype html><html><head><meta charset='utf-8'><title>{esc(title)}</title><style>{STYLE}</style></head><body>{''.join(pages)}</body></html>"


def build_prd() -> str:
    pages = [
        cover(
            "AI 求职工作台 PRD 摘要",
            "面向实习和校招求职学生的 AI 产品 Demo，用结构化工作流支持 JD 解析、简历匹配、PRD 初稿、竞品分析和面试准备。",
            ["JD 解析", "简历匹配", "面试准备", "Token 成本", "输出质检"],
            [("6", "核心模块"), ("8", "PRD 页"), ("1", "完整工作流")],
            1,
        ),
        page(
            "需求背景",
            "01 Context",
            2,
            cards(
                [
                    ("岗位信息难理解", "学生常把 JD 当关键词列表，难判断真实筛选标准和隐性能力要求。"),
                    ("简历修改缺方向", "经历与岗位之间缺少映射，容易写成泛泛描述，缺少成果指标。"),
                    ("面试准备不闭环", "JD、简历、项目材料和面试题分散，准备过程不可追踪。"),
                ]
            )
            + "<p class='note'>产品机会：把岗位、背景、输出质量和下一步行动放入同一个工作台，形成可复用的求职准备流程。</p>",
            "先解决求职学生最痛的“理解岗位”和“知道下一步”。",
        ),
        page(
            "用户与场景",
            "02 Users",
            3,
            "<div class='split'><div>"
            + cards(
                [
                    ("目标用户", "正在找实习或校招的学生，方向包括产品、运营、数据分析等。"),
                    ("核心场景", "看到 JD 后，需要快速判断匹配度、修改简历并准备面试。"),
                ],
                "two",
            )
            + "</div><div>"
            + table(
                ["场景", "用户动作", "系统输出"],
                [
                    ["投递前", "粘贴 JD 和背景", "岗位要求、匹配度、短板"],
                    ["改简历", "选择简历匹配", "改写建议、项目表达"],
                    ["面试前", "选择面试问题", "高频问题、追问、准备清单"],
                ],
            )
            + "</div></div>",
            "围绕投递前、改简历、面试前三个高频节点设计。",
        ),
        page(
            "功能范围",
            "03 Scope",
            4,
            table(
                ["优先级", "模块", "说明", "验收点"],
                [
                    ["P0", "JD 解析", "提取职责、关键词、隐性要求", "输出结构完整，可复制"],
                    ["P0", "简历匹配", "分析优势、短板、修改方向", "建议具体到经历表达"],
                    ["P0", "面试问题", "基于 JD 和背景生成问题", "覆盖行为题和项目追问"],
                    ["P1", "竞品分析", "生成分析框架和对比维度", "能用于作品集补充"],
                    ["P1", "PRD 初稿", "生成页面、字段、状态、异常", "可作为文档初稿"],
                    ["P1", "输出质检", "检查空泛、缺项、不可执行", "给出修正建议"],
                ],
            ),
            "P0 保证求职闭环，P1 体现 AI 产品方法论。",
        ),
        page(
            "页面结构",
            "04 IA",
            5,
            "<div class='flow'>"
            "<article><span>左侧任务导航</span><h3>六类求职任务</h3><p>JD 解析、简历匹配、竞品分析、PRD 初稿、面试问题、输出质检。</p></article>"
            "<article><span>中间工作区</span><h3>输入与结构化输出</h3><p>保留原 API 表单，增加任务上下文、示例结果和卡片化输出。</p></article>"
            "<article><span>右侧洞察</span><h3>看板与成本</h3><p>展示已分析岗位、待优化项、模型成本和本地历史。</p></article>"
            "</div>"
            + cards(
                [
                    ("Toolbar", "保留 Demo、GitHub、示例入口。"),
                    ("Tabs / Sidebar", "让用户在任务之间快速切换。"),
                    ("Result Cards", "输出按评分、关键词、优势、短板和行动拆分。"),
                ]
            )
            + table(
                ["区域", "默认状态", "交互反馈", "展示价值"],
                [
                    ["任务导航", "JD 解析选中", "点击切换标题、标签和说明", "证明不是静态说明页"],
                    ["输入表单", "保留 API 字段", "focus 高亮、示例填充", "保证原逻辑可用"],
                    ["结果洞察", "结构化示例", "生成后替换为 API 输出", "截图不再空白"],
                ],
            ),
            "第一屏直接呈现可操作工作台，而不是说明页。",
        ),
        page(
            "核心流程",
            "05 Flow",
            6,
            "<div class='flow'>"
            "<article><span>Input</span><h3>JD + 背景 + 目标岗位</h3><p>统一输入字段，降低自由 Prompt 的不稳定性。</p></article>"
            "<article><span>Process</span><h3>模板库 + Agent + 质检</h3><p>按任务组织提示词，并在输出后检查结构和可执行性。</p></article>"
            "<article><span>Output</span><h3>报告 + 简历建议 + 面试题</h3><p>形成可复制、可保存、可继续完善的求职资产。</p></article>"
            "</div>"
            + "<p class='takeaway'>流程设计重点：不是只生成答案，而是把求职准备拆成可追踪的工作流。</p>",
            "输入、处理、输出三段清晰，方便后续接入真实模型。",
        ),
        page(
            "异常与验收",
            "06 QA",
            7,
            table(
                ["类型", "异常", "处理方式", "验收标准"],
                [
                    ["输入", "JD 或背景为空", "前端 required + 错误提示", "用户知道缺少什么"],
                    ["接口", "API 返回失败", "展示失败原因，不清空输入", "可重试"],
                    ["输出", "内容空泛", "质检模块提示缺少证据", "建议可执行"],
                    ["保存", "无结果时保存", "提示暂无可保存结果", "不写入空记录"],
                ],
            )
            + cards(
                [
                    ("复制", "有结果时一键复制，便于粘贴到简历或文档。"),
                    ("保存", "localStorage 保存历史，便于按岗位归档。"),
                    ("清空", "只重置输入和结果，不影响接口逻辑。"),
                ]
            ),
            "Demo 的可信度来自完整状态，而不是单一表单。",
        ),
        page(
            "指标与迭代",
            "07 Metrics",
            8,
            "<div class='big-number-grid'>"
            "<div class='big-number'><strong>60s</strong><span>完成初步岗位理解</span></div>"
            "<div class='big-number'><strong>3+</strong><span>每次输出可执行建议</span></div>"
            "<div class='big-number'><strong>10</strong><span>本地历史保存上限</span></div>"
            "</div>"
            + table(
                ["阶段", "目标", "重点"],
                [
                    ["P0", "完成可演示闭环", "工作台、结构化输出、示例结果"],
                    ["P1", "提升作品集说服力", "PDF 模板、成本测算、截图展示"],
                    ["P2", "接近真实产品", "账号、项目看板、批量 JD、导出"],
                ],
            ),
            "下一步优先增强真实使用感，而不是继续增加解释文字。",
        ),
    ]
    return html_doc("AI 求职工作台 PRD 摘要", pages)


def build_portfolio() -> str:
    screenshot = (ROOT / "assets" / "demo-workspace-home.png").as_uri()
    pages = [
        cover(
            "AI 求职工作台作品集",
            "一个面向求职学生的轻量 AI 产品 Demo，展示从用户问题、产品方案、Demo 实现到成本测算的完整产品思考。",
            ["作品集项目", "AI 工作流", "前端 Demo", "PRD", "商业化分析"],
            [("12", "展示页"), ("6", "功能模块"), ("5", "模型成本")],
            1,
        ),
        page("项目背景", "01 Background", 2, cards([
            ("学生痛点", "岗位要求难拆解、简历表达无重点、面试准备没有闭环。"),
            ("产品机会", "LLM 适合把非结构化 JD 和个人背景转成结构化求职方案。"),
            ("作品集目标", "让面试官看到需求分析、Prompt、成本和 Demo 实现能力。"),
        ]) + "<p class='note'>定位不是聊天工具，而是围绕求职任务组织的工作台。</p>", "从真实求职场景出发，而不是为了 AI 而 AI。"),
        page("用户研究", "02 Research", 3, "<div class='split'><div>" + cards([
            ("对象", "找实习和校招的本科、硕士学生。"),
            ("问题", "不知道 JD 里的核心筛选点，也不知道简历该怎么改。"),
        ], "two") + "</div><div>" + table(["洞察", "设计转化"], [
            ["先看懂岗位", "JD 解析模块"],
            ["知道差距", "简历匹配与短板分析"],
            ["准备面试", "个性化问题和行动清单"],
            ["可复用材料", "本地历史和 PDF 作品集"],
        ]) + "</div></div>", "用户研究最终要落到功能结构。"),
        page("竞品分析", "03 Competitors", 4, table(["竞品类型", "优势", "不足", "启发"], [
            ["ChatGPT / 通义", "泛化能力强", "缺少求职流程管理", "需要任务化工作台"],
            ["简历工具", "模板成熟", "对 JD 理解弱", "增强岗位到简历映射"],
            ["飞书 / Notion", "结构化协作好", "不专注求职", "借鉴看板和数据库感"],
            ["面试题库", "题目多", "个性化不足", "基于 JD + 背景生成"],
        ]), "差异点：求职流程 + AI 结构化输出。"),
        page("产品定位", "04 Positioning", 5, cards([
            ("目标用户", "正在找实习和校招的学生。"),
            ("核心价值", "把岗位 JD 转成差距、简历建议和面试准备。"),
            ("使用场景", "投递前 10 分钟快速完成岗位理解和准备规划。"),
            ("体验原则", "少文字、强结构、能操作、可保存。"),
        ], "four") + "<div class='chip-row'>" + chips(["JD 解析", "简历匹配", "竞品分析", "PRD 初稿", "面试问题", "输出质检"]) + "</div>", "定位清楚后，页面就应该像工具，而不是说明页。"),
        page("功能架构", "05 Architecture", 6, "<div class='flow'><article><span>任务层</span><h3>六个功能模块</h3><p>覆盖求职准备和作品集补充。</p></article><article><span>能力层</span><h3>Prompt + Agent + QA</h3><p>通过模板和质检约束输出质量。</p></article><article><span>资产层</span><h3>历史 + PDF + 截图</h3><p>把输出沉淀成可展示材料。</p></article></div>" + cards([
            ("输入标准化", "目标岗位、JD、个人背景、分析深度。"),
            ("输出卡片化", "评分、关键词、优势、短板、行动。"),
            ("成本可见", "模型选择和 token 预估放在右侧。"),
        ]), "架构重点是让 AI 输出被管理。"),
        page("核心流程", "06 Workflow", 7, "<div class='flow'><article><span>输入</span><h3>岗位 JD + 背景</h3><p>收集岗位和候选人信息。</p></article><article><span>处理</span><h3>模板库 + 质量检查</h3><p>按任务生成结构化分析。</p></article><article><span>输出</span><h3>求职方案</h3><p>形成简历建议、问题和下一步。</p></article></div>" + "<p class='takeaway'>流程闭环：理解岗位 → 定位差距 → 修改材料 → 准备面试。</p>", "好 Demo 需要一眼看懂输入输出链路。"),
        page("Demo 展示", "07 Demo", 8, f"<div class='split'><div class='stack'><h3>工作台改造</h3>{bullets(['左侧任务导航，第一屏直接可操作。','中间保留 API 表单并增加结构化结果卡片。','右侧加入求职看板、本地历史和模型成本。'])}<p class='note'>截图用于 GitHub 和作品集展示，避免空白 Demo。</p></div><img class='screenshot' src='{screenshot}' alt='AI 求职工作台 Demo 截图' /></div>", "截图要展示产品能力，而不是空状态。"),
        page("PRD 摘要", "08 PRD", 9, table(["模块", "关键字段", "状态", "验收"], [
            ["输入表单", "目标岗位、JD、背景、分析深度", "默认、聚焦、错误", "必填校验有效"],
            ["结果洞察", "评分、关键词、优势、短板、行动", "示例、生成中、成功", "结构清晰可复制"],
            ["看板", "已分析、待优化、待面试、已保存", "静态 + localStorage", "保存后数量变化"],
            ["成本组件", "模型、预估成本、说明", "选中、hover", "切换反馈明确"],
        ]), "PRD 不是长文，而是关键决策和验收。"),
        page("Token 成本", "09 Cost", 10, "<div class='big-number-grid'><div class='big-number'><strong>0.0345</strong><span>DeepSeek 标准任务 RMB</span></div><div class='big-number'><strong>0.1242</strong><span>GPT 标准任务 RMB</span></div><div class='big-number'><strong>2.5x</strong><span>安全系数覆盖重试与冗余</span></div></div>" + table(["模型", "适用场景", "判断"], [
            ["DeepSeek", "高频标准分析", "成本低，适合 Demo 默认选项"],
            ["Kimi", "长文本材料", "适合长 JD 和简历"],
            ["GPT / Claude", "复杂报告和 PRD", "质量更稳但成本更高"],
            ["Gemini", "多模态扩展", "适合后续截图/文件输入"],
        ]), "成本测算让项目更像 AI 产品，而不是普通网页。"),
        page("迭代计划", "10 Roadmap", 11, table(["优先级", "迭代项", "价值"], [
            ["P0", "工作台 UI、示例结果、PDF 重排", "提升展示完成度"],
            ["P1", "多岗位项目看板、批量 JD 分析", "更贴近真实使用"],
            ["P1", "导出简历建议和面试题", "沉淀求职资产"],
            ["P2", "账号、云端保存、真实模型路由", "进入可运营产品形态"],
        ]) + cards([
            ("短期", "强化视觉和交互，让面试官愿意点开。"),
            ("中期", "增加批量分析和投递追踪。"),
            ("长期", "做成可复用的求职 Agent 工作台。"),
        ]), "先完成强展示，再扩展真实使用。"),
        page("项目价值", "11 Summary", 12, cards([
            ("产品能力", "用户场景、功能架构、PRD、竞品和迭代计划完整。"),
            ("AI 能力", "Prompt 模板、Agent 流程、输出质检和成本测算。"),
            ("工程能力", "原生前端 Demo、Node API、本地保存和自动生成 PDF。"),
        ]) + "<p class='note'>这个项目可以用于投递时证明：能把 AI 工具从想法做成一个可演示、可解释、可迭代的产品。</p>", "作品集要让人看到完整链路和执行力。"),
    ]
    return html_doc("AI 求职工作台作品集", pages)


def print_pdf(html_path: Path, pdf_path: Path) -> None:
    if not EDGE.exists():
        raise FileNotFoundError(f"Microsoft Edge not found at {EDGE}")
    pdf_path.unlink(missing_ok=True)
    subprocess.run(
        [
            str(EDGE),
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            html_path.as_uri(),
        ],
        check=True,
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("prd", build_prd(), ROOT / "docs" / "ai-job-workspace-prd.pdf"),
        ("portfolio", build_portfolio(), ROOT / "docs" / "ai-job-workspace-portfolio.pdf"),
    ]

    for name, content, pdf_path in jobs:
        html_path = OUT_DIR / f"{name}.html"
        html_path.write_text(content, encoding="utf-8")
        print_pdf(html_path, pdf_path)
        print(f"generated {pdf_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
