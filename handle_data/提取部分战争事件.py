import json
from collections import defaultdict

# 读取源文件
with open('data/base_info/wars_with_dynasty.json', 'r', encoding='utf-8') as f:
    wars = json.load(f)

# 创建每100年一个区间的字典
interval_wars = defaultdict(list)

for war in wars:
    year = war['year']
    # 计算区间起点（负数年份也正确处理）
    if year >= 0:
        start = (year // 300) * 100
    else:
        start = (year // 300) * 100  # 负数一样处理

    interval_wars[start].append(war)

# 按区间收集最多两个事件
brief_wars = []
for start in sorted(interval_wars.keys()):
    selected = interval_wars[start][:1]  # 每个区间最多取1个
    for war in selected:
        if war['year'] < -2070:
            continue
        brief_wars.append({
            "name": war["name"],
            "year": war["year"],
            "type": "战争"  # 固定为“战争”
        })

# 保存到新文件
with open('data/base_info/brief_wars_events.json', 'w', encoding='utf-8') as f:
    json.dump(brief_wars, f, ensure_ascii=False, indent=4)

print(f"提取完成，生成 {len(brief_wars)} 条记录，已保存到 brief_wars_events.json")
