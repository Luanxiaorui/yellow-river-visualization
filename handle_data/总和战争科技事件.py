import json

# 读取文件
with open('data/base_info/science_with_dynasty.json', 'r', encoding='utf-8') as f:
    science_events = json.load(f)

with open('data/base_info/wars_with_dynasty.json', 'r', encoding='utf-8') as f:
    wars_events = json.load(f)

# 修改 type
for event in science_events:
    event['type'] = '科技'

for event in wars_events:
    event['type'] = '战争'

# 合并
all_events = science_events + wars_events

# 保存
with open('data/info_show/all_events_for_tableau.json', 'w', encoding='utf-8') as f:
    json.dump(all_events, f, ensure_ascii=False, indent=4)

print("✅ 成功生成 all_events_for_tableau.json！")
