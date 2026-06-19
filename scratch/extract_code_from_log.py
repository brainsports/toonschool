import json

log_file = r"C:\Users\oomir\.gemini\antigravity\brain\62b65f31-fb81-41cb-b9dc-a78cbc54baf8\.system_generated\logs\transcript_full.jsonl"

def extract_all_writes():
    print("Reading log file to extract all write_to_file calls...")
    
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                step_idx = data.get("step_index", 0)
                tool_calls = data.get("tool_calls", [])
                
                for tc in tool_calls:
                    name = tc.get("name", "")
                    args = tc.get("args", {})
                    target_file = args.get("TargetFile", "")
                    
                    if "ToonEditor.tsx" in target_file and name == "write_to_file":
                        content = args.get("CodeContent", "")
                        print(f"Step {step_idx}: Found write_to_file, content length: {len(content)}")
                        
                        # 파일로 저장
                        filename = f"scratch/write_step_{step_idx}.tsx"
                        with open(filename, "w", encoding="utf-8") as out:
                            out.write(content)
                        print(f"  -> Saved to {filename}")
                        
            except Exception as e:
                continue

extract_all_writes()
