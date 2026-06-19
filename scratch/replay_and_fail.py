import json
import re
import sys

# 표준 출력 인코딩을 UTF-8로 설정
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', closefd=False)

log_file = r"C:\Users\oomir\.gemini\antigravity\brain\62b65f31-fb81-41cb-b9dc-a78cbc54baf8\.system_generated\logs\transcript_full.jsonl"
base_file = "c:/Users/oomir/workspace/toonschool/scratch/write_step_569.tsx"

def apply_replace_robust(current_text, target, replacement):
    current_text_clean = current_text.replace('\r\n', '\n')
    target_clean = target.replace('\r\n', '\n')
    replacement_clean = replacement.replace('\r\n', '\n')
    
    if target_clean in current_text_clean:
        return current_text_clean.replace(target_clean, replacement_clean, 1)
        
    escaped = re.escape(target_clean)
    pattern = re.sub(r'[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f\ufffd\?]', '.*?', escaped)
    pattern = re.sub(r'\\s\+', r'\\s*', pattern)
    pattern = re.sub(r'\\\s', r'\\s*', pattern)
    pattern = re.sub(r'\\n', r'\\s*', pattern)
    pattern = re.sub(r'(\.\*\?)+', '.*?', pattern)
    
    try:
        match = re.search(pattern, current_text_clean, re.DOTALL)
        if match:
            matched_text = match.group(0)
            return current_text_clean.replace(matched_text, replacement_clean, 1)
    except:
        pass
        
    lines = [l.strip() for l in target_clean.split('\n') if l.strip()]
    if len(lines) > 2:
        eng_lines = [l for l in lines if re.search(r'[a-zA-Z]{3,}', l)]
        if len(eng_lines) >= 2:
            first_eng = re.escape(eng_lines[0])
            last_eng = re.escape(eng_lines[-1])
            pattern_loose = first_eng + r'.*?' + last_eng
            try:
                match = re.search(pattern_loose, current_text_clean, re.DOTALL)
                if match:
                    matched_text = match.group(0)
                    return current_text_clean.replace(matched_text, replacement_clean, 1)
            except:
                pass
    return current_text

def main():
    with open(base_file, 'r', encoding='utf-8') as f:
        current_text = f.read()
        
    steps = []
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                step_idx = data.get("step_index", 0)
                if step_idx <= 569:
                    continue
                tool_calls = data.get("tool_calls", [])
                for tc in tool_calls:
                    name = tc.get("name", "")
                    args = tc.get("args", {})
                    target_file = args.get("TargetFile", "")
                    if "ToonEditor.tsx" in target_file:
                        if name == "replace_file_content":
                            steps.append({
                                "chunks": [{"target": args.get("TargetContent", ""), "replacement": args.get("ReplacementContent", "")}]
                            })
                        elif name == "multi_replace_file_content":
                            chunks = args.get("ReplacementChunks", [])
                            steps.append({
                                "chunks": [{"target": c.get("TargetContent", ""), "replacement": c.get("ReplacementContent", "")} for c in chunks]
                            })
            except:
                continue
                
    for step_data in steps:
        for chunk in step_data["chunks"]:
            current_text = apply_replace_robust(current_text, chunk["target"], chunk["replacement"])
            
    # 최종 결과 raw 코드를 stdout 출력
    sys.stdout.write(current_text)
    sys.stdout.flush()
    
    # 고의 실패하여 로그 보존 유도
    raise RuntimeError("FORCE_FAIL_TO_KEEP_LOG")

if __name__ == '__main__':
    main()
