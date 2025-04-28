import json
import csv

# 读取JSON
with open('data/info_show/all_events_for_tableau.json', 'r', encoding='utf-8') as f:
    events = json.load(f)

data_sorted = sorted(events, key=lambda x: x['year'])

# 写入CSV
with open('data/info_show/all_events_for_tableau.csv', 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'year', 'type', 'dynasty'])
    writer.writeheader()
    writer.writerows(data_sorted)

print("✅ 成功生成 all_events_for_tableau.csv！")
