from __future__ import annotations

import html
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "outputs" / "pdf-build"
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def inline_md(text: str) -> str:
    escaped = html.escape(text)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<span class="link">\1</span>', escaped)
    return escaped


def render_table(lines: list[str]) -> str:
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        rows.append(cells)
    if not rows:
        return ""
    head = rows[0]
    body = rows[1:]
    col_count = len(head)
    col_width = 100 / max(col_count, 1)
    html_rows = [
        "<table>",
        "<thead><tr>",
        *[f'<th style="width:{col_width:.2f}%">{inline_md(cell)}</th>' for cell in head],
        "</tr></thead>",
        "<tbody>",
    ]
    for row in body:
        html_rows.append("<tr>")
        for cell in row:
            html_rows.append(f"<td>{inline_md(cell)}</td>")
        html_rows.append("</tr>")
    html_rows.extend(["</tbody>", "</table>"])
    return "\n".join(html_rows)


def render_markdown(markdown: str) -> str:
    lines = markdown.splitlines()
    blocks: list[str] = []
    i = 0
    in_code = False
    code_lines: list[str] = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                blocks.append(f"<pre>{html.escape(chr(10).join(code_lines))}</pre>")
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if not stripped:
            i += 1
            continue

        if stripped.startswith("|") and "|" in stripped[1:]:
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            blocks.append(render_table(table_lines))
            continue

        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            level = len(heading.group(1))
            text = heading.group(2)
            hid = slug(text)
            blocks.append(f'<h{level} id="{hid}">{inline_md(text)}</h{level}>')
            i += 1
            continue

        if stripped.startswith(">"):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip().lstrip(">").strip())
                i += 1
            blocks.append(f'<blockquote>{"<br>".join(inline_md(item) for item in quote_lines)}</blockquote>')
            continue

        if re.match(r"^[-*]\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i].strip()):
                items.append(re.sub(r"^[-*]\s+", "", lines[i].strip()))
                i += 1
            blocks.append("<ul>" + "".join(f"<li>{inline_md(item)}</li>" for item in items) + "</ul>")
            continue

        if re.match(r"^\d+\.\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i].strip()):
                items.append(re.sub(r"^\d+\.\s+", "", lines[i].strip()))
                i += 1
            blocks.append("<ol>" + "".join(f"<li>{inline_md(item)}</li>" for item in items) + "</ol>")
            continue

        para = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if (
                not nxt
                or nxt.startswith("#")
                or nxt.startswith("|")
                or nxt.startswith(">")
                or nxt.startswith("```")
                or re.match(r"^[-*]\s+", nxt)
                or re.match(r"^\d+\.\s+", nxt)
            ):
                break
            para.append(nxt)
            i += 1
        blocks.append(f"<p>{inline_md(' '.join(para))}</p>")

    return "\n".join(blocks)


STYLE = """
@page { size: A4; margin: 16mm 16mm 18mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  color: #172033;
  background: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
  line-height: 1.62;
}
.page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto 16px;
  padding: 18mm 17mm;
  background: #fff;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}
.cover {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 258mm;
  color: #fff;
  background: linear-gradient(135deg, #101827, #243b8f 58%, #6d3ff5);
}
.cover h1 {
  max-width: 138mm;
  margin: 0 0 8mm;
  color: #fff;
  font-size: 34pt;
  line-height: 1.08;
}
.cover p {
  max-width: 150mm;
  color: rgba(255, 255, 255, 0.82);
  font-size: 13pt;
}
.cover .meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4mm;
}
.cover .meta span {
  padding: 4mm;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 4mm;
  background: rgba(255, 255, 255, 0.08);
  font-size: 9pt;
}
.doc-title {
  margin-bottom: 9mm;
  padding-bottom: 5mm;
  border-bottom: 1px solid #dbe3ef;
}
.doc-title h1 {
  margin: 0 0 3mm;
  color: #111827;
  font-size: 24pt;
}
.doc-title p {
  margin: 0;
  color: #667085;
}
h1, h2, h3, h4 {
  break-after: avoid;
  color: #111827;
  line-height: 1.28;
}
h1 { font-size: 22pt; margin: 0 0 7mm; }
h2 {
  margin: 11mm 0 4mm;
  padding-top: 2mm;
  color: #1d3edb;
  font-size: 15pt;
}
h3 { margin: 7mm 0 3mm; font-size: 12pt; }
h4 { margin: 5mm 0 2mm; font-size: 10.5pt; }
p { margin: 0 0 3.2mm; font-size: 9.5pt; }
ul, ol { margin: 0 0 4mm 5mm; padding-left: 5mm; }
li { margin: 0 0 1.4mm; font-size: 9.3pt; }
blockquote {
  margin: 5mm 0;
  padding: 4mm 5mm;
  border-left: 4px solid #355cff;
  border-radius: 3mm;
  background: #f4f7ff;
  color: #243044;
  font-weight: 650;
}
table {
  width: 100%;
  margin: 4mm 0 6mm;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  break-inside: avoid;
  border: 1px solid #dbe3ef;
  border-radius: 3mm;
  overflow: hidden;
}
th, td {
  padding: 2.6mm 3mm;
  border-right: 1px solid #dbe3ef;
  border-bottom: 1px solid #dbe3ef;
  vertical-align: middle;
  overflow-wrap: break-word;
  font-size: 8.4pt;
}
th {
  color: #172033;
  background: #eef2ff;
  text-align: left;
  font-weight: 800;
}
tr:last-child td { border-bottom: 0; }
th:last-child, td:last-child { border-right: 0; }
pre {
  margin: 4mm 0 5mm;
  padding: 4mm;
  border-radius: 3mm;
  background: #111827;
  color: #e5e7eb;
  white-space: pre-wrap;
  font-size: 8pt;
  line-height: 1.55;
}
code {
  padding: 0.4mm 1mm;
  border-radius: 1.4mm;
  background: #eef2ff;
  color: #243b8f;
  font-size: 8.5pt;
}
.link { color: #1d3edb; font-weight: 700; }
.toc {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3mm;
  margin: 4mm 0 8mm;
}
.toc span {
  padding: 3mm 3.5mm;
  border: 1px solid #dbe3ef;
  border-radius: 3mm;
  background: #f8faff;
  color: #344054;
  font-size: 9pt;
  font-weight: 700;
}
.content { break-before: page; }
@media print {
  body { background: #fff; }
  .page { width: auto; min-height: auto; margin: 0; box-shadow: none; break-after: page; }
  .page:last-child { break-after: auto; }
}
"""


def build_html(title: str, subtitle: str, markdown: str, output: Path) -> None:
    body = render_markdown(markdown)
    headings = re.findall(r"^##\s+(.+)$", markdown, flags=re.MULTILINE)
    toc = "".join(f"<span>{html.escape(item)}</span>" for item in headings[:12])
    page = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>{html.escape(title)}</title>
  <style>{STYLE}</style>
</head>
<body>
  <section class="page cover">
    <div>
      <p class="eyebrow">AI 求职工作台</p>
      <h1>{html.escape(title)}</h1>
      <p>{html.escape(subtitle)}</p>
    </div>
    <div class="meta">
      <span>产品：AI 求职工作台</span>
      <span>场景：JD 解析 / 简历优化 / 面试准备</span>
      <span>输出：作品集 PDF</span>
    </div>
  </section>
  <section class="page">
    <div class="doc-title">
      <h1>{html.escape(title)}</h1>
      <p>{html.escape(subtitle)}</p>
    </div>
    <div class="toc">{toc}</div>
  </section>
  <section class="page content">{body}</section>
</body>
</html>"""
    output.write_text(page, encoding="utf-8")


def print_pdf(html_path: Path, pdf_path: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
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
        cwd=ROOT,
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    builds = [
        (
            "AI 求职工作台 MVP PRD",
            "面向求职学生的 JD 解析、简历优化与面试准备产品需求文档",
            ROOT / "docs" / "prd.md",
            OUT_DIR / "ai-job-workspace-prd.html",
            ROOT / "docs" / "ai-job-workspace-prd.pdf",
        ),
        (
            "AI 求职工作台作品集",
            "从用户研究、竞品分析、产品方案、PRD 到成本测算的作品集展示",
            ROOT / "docs" / "portfolio-pdf-outline.md",
            OUT_DIR / "ai-job-workspace-portfolio.html",
            ROOT / "docs" / "ai-job-workspace-portfolio.pdf",
        ),
    ]
    for title, subtitle, md_path, html_path, pdf_path in builds:
        build_html(title, subtitle, md_path.read_text(encoding="utf-8"), html_path)
        print_pdf(html_path, pdf_path)
        print(f"Built {pdf_path}")


if __name__ == "__main__":
    main()
