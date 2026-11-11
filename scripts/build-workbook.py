"""Build the v0.2 formatted Excel workbook from docs/numbers/*.csv."""
import csv
import re
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "numbers"
OUT = SRC / "青岚宗数值清单-v0.2.xlsx"

HEADER_FILL = PatternFill("solid", fgColor="133126")
HEADER_FONT = Font(name="Microsoft YaHei", size=11, bold=True, color="E8D8B0")
BODY_FONT = Font(name="Microsoft YaHei", size=10, color="2B2B2B")
TITLE_FONT = Font(name="Microsoft YaHei", size=16, bold=True, color="133126")
MUTED_FONT = Font(name="Microsoft YaHei", size=9, color="666666")
SECTION_FONT = Font(name="Microsoft YaHei", size=11, bold=True, color="8A6D36")
ALT_FILL = PatternFill("solid", fgColor="F6F2E8")
THIN = Side(style="thin", color="DDD5C4")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def convert(value):
    if value is None:
        return ""
    s = str(value).strip()
    if s == "":
        return ""
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if re.fullmatch(r"-?\d+\.\d+", s):
        return float(s)
    return s


def read_csv(name):
    with open(SRC / name, encoding="utf-8-sig", newline="") as f:
        return list(csv.reader(f))


def style_sheet(ws, header, rows, widths=None):
    ws.sheet_view.showGridLines = False
    for c, value in enumerate(header, 1):
        cell = ws.cell(row=1, column=c, value=value)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = BORDER
    ws.row_dimensions[1].height = 30

    for r, row in enumerate(rows, 2):
        for c, value in enumerate(row, 1):
            cell = ws.cell(row=r, column=c, value=convert(value))
            cell.font = BODY_FONT
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = BORDER
            if r % 2 == 0:
                cell.fill = ALT_FILL

    for c in range(1, len(header) + 1):
        best = len(str(header[c - 1]))
        for row in rows:
            if c - 1 < len(row):
                text = str(row[c - 1])
                best = max(best, sum(2 if ord(ch) > 127 else 1 for ch in text))
        width = widths.get(c, min(max(10, best * 0.72 + 2), 56)) if widths else min(max(10, best * 0.72 + 2), 56)
        ws.column_dimensions[get_column_letter(c)].width = width

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(header))}{len(rows) + 1}"


wb = Workbook()
wb.remove(wb.active)

# ---------- 说明 ----------
ws = wb.create_sheet("说明")
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 3
ws.column_dimensions["B"].width = 24
ws.column_dimensions["C"].width = 104
ws["B2"] = "青岚宗 · 数值清单 v0.2"
ws["B2"].font = TITLE_FONT
ws.merge_cells("B2:C2")
ws["B3"] = "当前目标：30 天内将声望提升至 300；日终结算后灵石仍为负才解散。"
ws["B3"].font = Font(name="Microsoft YaHei", size=10, color="555555")
ws.merge_cells("B3:C3")

notes = [
    ("生成日期", "2026-11-10"),
    ("数据来源", "src/game/engine.ts、cards.ts、events.ts（当前代码实际值）"),
    ("可编辑备份", "docs/numbers/constants.csv、cards.csv、events.csv"),
    ("工作表", "常量 = 全局参数与规则；卡牌 = 29 张卡牌/设施；事件 = 11 个随机事件；平衡模拟 = 500 局脚本结果"),
    ("修改流程", "先在表里编排 → 确认版本 → 由开发一次性落到代码 → 跑 npm run sim、check-rules 与 e2e 验证"),
    ("关键联动", "弟子净收入影响招收/广纳/山门/演武场/征税；设施费用与产出共同决定回本；稀有度权重影响整个坊市概率"),
    ("注意", "本表是数值清单，不是游戏运行时的配置源。实际生效值以 src/game 下的代码为准。"),
]
row = 5
for label, text in notes:
    ws.cell(row=row, column=2, value=label).font = SECTION_FONT
    ws.cell(row=row, column=2).alignment = Alignment(vertical="top")
    cell = ws.cell(row=row, column=3, value=text)
    cell.font = Font(name="Microsoft YaHei", size=10, color="333333")
    cell.alignment = Alignment(vertical="top", wrap_text=True)
    ws.row_dimensions[row].height = 26 if len(text) < 40 else 38
    row += 1

row += 1
ws.cell(row=row, column=2, value="当前常量速览").font = Font(name="Microsoft YaHei", size=12, bold=True, color="133126")
row += 1
quick = [
    ("天数上限 / 胜利声望", "30 天 / 300 声望"),
    ("初始灵石 / 弟子 / 声望", "20 / 2 / 0"),
    ("初始已建设施 / 初始牌组", "0 座 / 12 张（9 行动 + 3 设施）"),
    ("每日抽牌 / 设施位", "5 / 8"),
    ("坊市货位 / 换货", "1 行动 + 1 设施 / 2 灵石，每日 1 次，只换未售出"),
    ("弟子净收入", "+1 灵石/人/日"),
    ("事件触发", "第 3 日起 35%/日，最多 3 日必触发"),
    ("破产判定", "日终结算后灵石 < 0；日间可为负，免费牌可自救"),
    ("藏经阁叠加", "每座使讲道额外 +2 声望（4 座 = 10 声望）"),
]
for label, text in quick:
    ws.cell(row=row, column=2, value=label).font = BODY_FONT
    ws.cell(row=row, column=3, value=text).font = BODY_FONT
    row += 1

row += 1
ws.cell(row=row, column=2, value="v0.2 规则变更").font = Font(name="Microsoft YaHei", size=12, bold=True, color="133126")
row += 1
changes = [
    "坊市改为 1 张行动牌 + 1 张设施牌；行动池 15 张（7/6/2），设施池 9 张（4/3/2）。",
    "新增 9 张坊市行动牌；总卡牌类型 29 张（20 行动 + 9 设施）。",
    "藏经阁对讲道的加成按数量叠加：每座 +2 声望。",
    "破产只在日终结算后判定；日间灵石可为负，可用免费牌自救。",
    "换货只重抽未售出的货位；两个货位都售罄时按钮禁用。",
    "事件改为弹层确认，显示名称、效果和当前灵石为负的警告。",
    "设施位满时禁止打出设施牌（默认方案 A）。",
]
for text in changes:
    cell = ws.cell(row=row, column=2, value="•")
    cell.font = BODY_FONT
    cell.alignment = Alignment(horizontal="center", vertical="top")
    cell = ws.cell(row=row, column=3, value=text)
    cell.font = BODY_FONT
    cell.alignment = Alignment(vertical="top", wrap_text=True)
    row += 1

row += 1
ws.cell(row=row, column=2, value="坊市概率").font = Font(name="Microsoft YaHei", size=12, bold=True, color="133126")
row += 1
prob_rows = [
    ("行动货位", "常见 62.50% / 少见 32.14% / 稀有 5.36%（总权重 56）"),
    ("设施货位", "常见 62.50% / 少见 28.125% / 稀有 9.375%（总权重 32）"),
    ("规则", "两个货位独立抽取；同一天不重复；购入价 = 卡牌费用"),
]
for label, text in prob_rows:
    ws.cell(row=row, column=2, value=label).font = BODY_FONT
    ws.cell(row=row, column=3, value=text).font = BODY_FONT
    row += 1

# ---------- 常量 ----------
rows = read_csv("constants.csv")
ws = wb.create_sheet("常量")
style_sheet(ws, rows[0], rows[1:], widths={1: 10, 2: 24, 3: 30, 4: 16, 5: 34, 6: 30})

# ---------- 卡牌 ----------
rows = read_csv("cards.csv")
ws = wb.create_sheet("卡牌")
style_sheet(
    ws,
    rows[0],
    rows[1:],
    widths={1: 14, 2: 14, 3: 8, 4: 8, 5: 9, 6: 7, 7: 9, 8: 9, 9: 9, 10: 9, 11: 7, 12: 10, 13: 10, 14: 12, 15: 42, 16: 20, 17: 24},
)

# ---------- 事件 ----------
rows = read_csv("events.csv")
ws = wb.create_sheet("事件")
style_sheet(ws, rows[0], rows[1:], widths={1: 14, 2: 14, 3: 7, 4: 12, 5: 9, 6: 34, 7: 38, 8: 20, 9: 22})

# ---------- 平衡模拟 ----------
ws = wb.create_sheet("平衡模拟")
sim_header = ["策略", "胜率", "破产率", "超时率", "平均胜利天数", "说明"]
sim_rows = [
    ["贪心（见牌就打）", "90.8%", "9.2%", "0.0%", 20.0, "不留余额，事件抗性差"],
    ["保留 10 灵石", "97.4%", "2.6%", "0.0%", 21.0, ""],
    ["保留 15 灵石", "98.0%", "1.8%", "0.2%", 21.5, ""],
    ["保留 20 灵石", "97.6%", "1.8%", "0.6%", 22.2, ""],
    ["保留 8 + 天数 灵石", "97.6%", "1.2%", "1.2%", 21.7, ""],
    ["保留 10 + 1.5×天数 灵石", "97.0%", "0.6%", "2.4%", 22.0, "当前最稳的脚本策略"],
]
style_sheet(ws, sim_header, sim_rows, widths={1: 30, 2: 10, 3: 10, 4: 10, 5: 16, 6: 34})
note_row = len(sim_rows) + 3
ws.cell(row=note_row, column=1, value="500 局/策略；目标 300；种子 1000–1499。脚本策略，不是人类玩家数据。").font = MUTED_FONT
ws.merge_cells(start_row=note_row, start_column=1, end_row=note_row, end_column=6)
ws.cell(row=note_row + 1, column=1, value="当前难度偏宽松；若要收紧，可提高目标到 400/450、改回混合池、加严事件或削弱新经济牌。").font = MUTED_FONT
ws.merge_cells(start_row=note_row + 1, start_column=1, end_row=note_row + 1, end_column=6)

wb.save(OUT)
print("saved", OUT)

# Remove the old v0.1 workbook now that v0.2 exists.
old = SRC / "青岚宗数值清单-v0.1.xlsx"
if old.exists():
    old.unlink()
    print("removed", old)
