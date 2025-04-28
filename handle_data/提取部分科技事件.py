import json
from collections import defaultdict

# 读取源文件
with open('data/base_info/science_events_dynasty.json', 'r', encoding='utf-8') as f:
    events = json.load(f)

# 创建每100年一个区间的字典
interval_events = defaultdict(list)

for event in events:
    year = event['year']
    # 将负数年份也划分，负的从 -9900 ~ -9800, -9800 ~ -9700 ... 以此类推
    # 计算区间起点
    if year >= 0:
        start = (year // 200) * 100
    else:
        start = (year // 200) * 100  # 负数也可以这么取整
    
    interval_events[start].append(event)

# 按区间收集最多两个事件
brief_events = []
for start in sorted(interval_events.keys()):
    selected = interval_events[start][:1]  # 每个区间选前一个
    for event in selected:
        if event['year'] < -2070:
            continue
        brief_events.append({
            "name": event["name"],
            "year": event["year"],
            "type": "科技"  # 固定为“科技”
        })

# 保存到新文件
with open('data/base_info/brief_science_events.json', 'w', encoding='utf-8') as f:
    json.dump(brief_events, f, ensure_ascii=False, indent=4)

print(f"提取完成，生成 {len(brief_events)} 条记录，已保存到 brief_science_events.json")
