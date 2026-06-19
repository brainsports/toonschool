import json
import re

log_file = r"C:\Users\oomir\.gemini\antigravity\brain\62b65f31-fb81-41cb-b9dc-a78cbc54baf8\.system_generated\logs\transcript_full.jsonl"
base_file = "scratch/write_step_569.tsx"
output_file = "scratch/restored_final_ToonEditor.tsx"

def clean_content(text):
    # 줄바꿈 통일
    return text.replace('\r\n', '\n').strip()

def apply_replace(current_text, target, replacement, step_idx, name):
    current_text_clean = current_text.replace('\r\n', '\n')
    target_clean = target.replace('\r\n', '\n')
    replacement_clean = replacement.replace('\r\n', '\n')
    
    # 1. 완전 일치 시도
    if target_clean in current_text_clean:
        new_text = current_text_clean.replace(target_clean, replacement_clean, 1)
        print(f"Step {step_idx} ({name}): Success (exact match)")
        return new_text
        
    # 2. 한글 깨짐 등으로 매칭이 안 될 때를 대비해, 특수문자와 영어 위주의 유연한 매칭 시도
    # 대상 타겟 텍스트의 정규식 패턴 만들기 (공백이나 한글 깨진 특수문자 ? 등을 와일드카드로 처리)
    # 한글 및 물음표(?) 문자를 \s*.*?\s* 처럼 느슨한 와일드카드로 대체
    escaped = re.escape(target_clean)
    # 한글 깨진 특수문자나 한글 부분을 와일드카드로 바꿈 (여기서는 간단히 [^a-zA-Z0-9_\s] 를 .*? 로 대체)
    # 또는 그냥 \? 부분을 와일드카드로 대체
    pattern = escaped.replace(r'\?', r'.*?').replace(r'\ ', r'\s+')
    
    try:
        match = re.search(pattern, current_text_clean, re.DOTALL)
        if match:
            matched_text = match.group(0)
            new_text = current_text_clean.replace(matched_text, replacement_clean, 1)
            print(f"Step {step_idx} ({name}): Success (fuzzy match)")
            return new_text
    except Exception as e:
        pass
        
    print(f"Step {step_idx} ({name}): Failed to apply replace!")
    print(f"  Target Preview (length {len(target)}): {repr(target[:120])}")
    return current_text

def replay_steps():
    # 베이스 코드 읽기
    with open(base_file, 'r', encoding='utf-8') as f:
        current_text = f.read()
        
    print(f"Loaded base file {base_file}, length: {len(current_text)}")
    
    steps = []
    
    # 로그 파일에서 570 이후의 replace 툴들을 시간 순으로 수집
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
                            target = args.get("TargetContent", "")
                            replacement = args.get("ReplacementContent", "")
                            steps.append({
                                "step": step_idx,
                                "name": name,
                                "chunks": [{"target": target, "replacement": replacement}]
                            })
                        elif name == "multi_replace_file_content":
                            chunks = args.get("ReplacementChunks", [])
                            steps.append({
                                "step": step_idx,
                                "name": name,
                                "chunks": [{"target": c.get("TargetContent", ""), "replacement": c.get("ReplacementContent", "")} for c in chunks]
                            })
            except Exception as e:
                continue
                
    print(f"Collected {len(steps)} steps to replay.")
    
    # 차례대로 적용
    for step_data in steps:
        step_idx = step_data["step"]
        name = step_data["name"]
        for chunk in step_data["chunks"]:
            current_text = apply_replace(current_text, chunk["target"], chunk["replacement"], step_idx, name)
            
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(current_text)
        
    print(f"Replay completed. Restored file written to {output_file}. Length: {len(current_text)}")

replay_steps()
