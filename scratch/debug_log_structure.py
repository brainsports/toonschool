import json

log_file = r"C:\Users\oomir\.gemini\antigravity\brain\62b65f31-fb81-41cb-b9dc-a78cbc54baf8\.system_generated\logs\transcript_full.jsonl"

with open(log_file, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                tool_calls = data.get("tool_calls", [])
                if tool_calls:
                    print("--- Tool Call Sample ---")
                    print(json.dumps(tool_calls[0], indent=2, ensure_ascii=False)[:1000])
                    break
        except Exception as e:
            continue
