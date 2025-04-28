import re
import json

# 在此处设置输入和输出文件路径
INPUT_FILE = 'data/wars.txt'        # 输入的文本文件路径
WARS_OUTPUT_FILE = 'data/wars01.json'  # 提取的战争基础信息 JSON
FINAL_OUTPUT_FILE = 'data/wars_with_dynasty.json'  # 包含朝代信息的最终 JSON

# 朝代定义列表
DYNASTIES = [
    {"name": "远古", "start": -100000, "end": -2069, "color": "#90ee90"},
    {"name": "夏", "start": -2070, "end": -1600, "color": "#90ee90"},
    {"name": "商", "start": -1600, "end": -1046, "color": "#000000"},
    {"name": "周", "start": -1046, "end": -256, "color": "#0000ff"},
    {"name": "秦", "start": -221,  "end": -207,  "color": "#ffffff"},
    {"name": "汉", "start": -202,  "end": 220,   "color": "#006400"},
    {"name": "三国", "start": 220,   "end": 280,   "color": "#808080"},
    {"name": "晋", "start": 265,   "end": 420,   "color": "#8080ff"},
    {"name": "十六国", "start": 304,   "end": 439,   "color": "#805580"},
    {"name": "南北朝", "start": 386,   "end": 589,   "color": "#808080"},
    {"name": "隋", "start": 581,   "end": 618,   "color": "#ffa500"},
    {"name": "唐", "start": 618,   "end": 907,   "color": "#ff0000"},
    {"name": "五代十国", "start": 907,   "end": 979,   "color": "#6F0000"},
    {"name": "宋", "start": 960,   "end": 1276,  "color": "#ffc0cb"},
    {"name": "元", "start": 1271,  "end": 1368,  "color": "#800080"},
    {"name": "明", "start": 1368,  "end": 1644,  "color": "#ffff00"},
    {"name": "清", "start": 1644,  "end": 1911,  "color": "#ffdab9"},
]


def extract_wars(text):
    """
    提取战争信息，匹配“前X世纪”、“YYYY年”、“YYYY年-YYYY年”或“YYYY年—YYYY年”格式。
    返回列表，每项字典包含 date(string) 和 name(string)。区间仅取开始年份。
    """
    wars = []
    # 支持半角-和全角—
    pattern = re.compile(r'^(前?\d+世纪|\d+年(?:\s*[–—-]\s*\d+年)?)[：:]\s*(.+)$')
    for line in text.splitlines():
        raw = line.strip(' \u3000\t')
        match = pattern.match(raw)
        if match:
            date, name = match.groups()
            date = date.replace(' ', '')
            # 标准化区间分隔符为-
            date = re.sub(r'[–—]', '-', date)
            # 区间仅保留开始年份或世纪
            if '-' in date:
                date = date.split('-')[0]
            wars.append({"date": date, "name": name})
    return wars


def determine_dynasty(year):
    """
    根据年份(整数)返回朝代名称，找不到返回 'Unknown'。
    """
    for d in DYNASTIES:
        if d['start'] <= year <= d['end']:
            return d['name']
    return 'Unknown'


def parse_year(date_str):
    """
    将日期字符串转换为整数年份：
    - "前X世纪" -> -X*100
    - "YYYY年" -> YYYY
    """
    if date_str.endswith('世纪'):
        num = int(date_str.replace('前', '').replace('世纪', ''))
        if date_str.startswith('前'):
            return -num * 100
        else:
            return num * 100
    if date_str.endswith('年') and date_str[:-1].lstrip('-').isdigit():
        return int(date_str[:-1])
    return None


def main():
    # 1. 提取基础战争信息
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"无法找到输入文件: {INPUT_FILE}")
        return

    wars = extract_wars(content)
    with open(WARS_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(wars, f, ensure_ascii=False, indent=2)
    print(f"已提取 {len(wars)} 条战争信息，输出到 {WARS_OUTPUT_FILE}")

    # 2. 生成包含朝代的最终 JSON
    enriched = []
    for w in wars:
        year = parse_year(w['date'])
        dynasty = determine_dynasty(year) if year is not None else 'Unknown'
        enriched.append({
            'name': w['name'],
            'year': year,
            'dynasty': dynasty
        })
    with open(FINAL_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    print(f"已生成包含朝代信息的文件，输出到 {FINAL_OUTPUT_FILE}")


if __name__ == '__main__':
    main()