# 素材与截图

本目录用于存放项目展示所需的图片素材，目前主要保留 Demo 首页截图，供 README、作品集 PDF 和 GitHub 展示使用。

## 当前文件

- `demo-workspace-home.png`：AI 求职工作台桌面端截图，用于展示当前 Demo 的主界面、任务导航、输入区、结果洞察、求职看板和模型成本组件。

## 生成说明

截图通常由 Playwright 从本地 Demo 页面生成，确保展示的是最新页面效果。示例命令：

```powershell
npx playwright screenshot --channel msedge --viewport-size=1440,1100 --wait-for-selector=.workspace-grid http://localhost:3000 assets\demo-workspace-home.png
```

## scripts 目录说明

项目根目录下的 `scripts` 目录用于放置项目自动化脚本。目前保留的脚本是：

- `scripts/build-portfolio-pdfs.py`：根据内置的 HTML/CSS 页面模板生成两份 PDF 交付物：
  - `docs/ai-job-workspace-prd.pdf`
  - `docs/ai-job-workspace-portfolio.pdf`

这个脚本不是后端接口，也不参与网页运行逻辑。它的作用是把 PRD 摘要和作品集内容按 16:9 页面重新排版，再通过本机 Microsoft Edge 的无头打印能力导出 PDF，避免直接把 Markdown 转 PDF 后出现排版松散、空白过多的问题。

运行方式：

```powershell
python scripts\build-portfolio-pdfs.py
```
