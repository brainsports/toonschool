import json
import re
import sys

# 터미널 한글 깨짐 및 인코딩 에러 방지
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

log_file = r"C:\Users\oomir\.gemini\antigravity\brain\62b65f31-fb81-41cb-b9dc-a78cbc54baf8\.system_generated\logs\transcript_full.jsonl"
base_file = "c:/Users/oomir/workspace/toonschool/scratch/write_step_569.tsx"
output_file = r"C:\Users\oomir\workspace\toonschool\scratch\restored_final_ToonEditor.tsx"

def clean_for_print(text):
    # 콘솔 출력 시 cp949 인코딩 에러를 방지하기 위해 cp949 표현 불가능한 문자를 대체
    return text.encode('cp949', errors='replace').decode('cp949')

def apply_replace_robust(current_text, target, replacement, step_idx, name):
    current_text_clean = current_text.replace('\r\n', '\n')
    target_clean = target.replace('\r\n', '\n')
    replacement_clean = replacement.replace('\r\n', '\n')
    
    # 1. 완전 일치 시도
    if target_clean in current_text_clean:
        new_text = current_text_clean.replace(target_clean, replacement_clean, 1)
        print(clean_for_print(f"Step {step_idx} ({name}): Success (exact match)"))
        return new_text
        
    # 2. 로버스트 정규식 매칭 시도
    # Target 텍스트를 정규식 패턴으로 만듦
    escaped = re.escape(target_clean)
    
    # 한글, ? 문자를 와일드카드 (.*?) 로 대체
    # 유니코드 한글 영역: \uac00-\ud7a3, \u1100-\u11ff, \u3130-\u318f 등
    # 또한 \ufffd (REPLACEMENT CHARACTER) 및 '?' 도 대체
    pattern = re.sub(r'[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f\ufffd\?]', '.*?', escaped)
    
    # 연속된 공백 및 줄바꿈을 유연하게 처리
    pattern = re.sub(r'\\s\+', r'\\s*', pattern)
    pattern = re.sub(r'\\\s', r'\\s*', pattern)
    pattern = re.sub(r'\\n', r'\\s*', pattern)
    
    # 중복 와일드카드 단순화
    pattern = re.sub(r'(\.\*\?)+', '.*?', pattern)
    
    try:
        # re.DOTALL을 주어 줄바꿈도 매칭
        match = re.search(pattern, current_text_clean, re.DOTALL)
        if match:
            matched_text = match.group(0)
            # 매치된 부분을 replacement로 대체
            new_text = current_text_clean.replace(matched_text, replacement_clean, 1)
            print(clean_for_print(f"Step {step_idx} ({name}): Success (fuzzy match)"))
            return new_text
    except Exception as e:
        pass
        
    # 3. 만약 실패하고 target이 너무 길다면, target 내의 영어/특수기호 키워드 행만 추출해 매칭 시도
    # Target의 첫 2줄과 마지막 2줄만 조합해서 매칭해볼 수도 있음
    lines = [l.strip() for l in target_clean.split('\n') if l.strip()]
    if len(lines) > 2:
        # 영어 알파벳이 들어간 첫 줄과 마지막 줄 추출
        eng_lines = [l for l in lines if re.search(r'[a-zA-Z]{3,}', l)]
        if len(eng_lines) >= 2:
            first_eng = re.escape(eng_lines[0])
            last_eng = re.escape(eng_lines[-1])
            # 두 줄 사이의 내용을 와일드카드로 매칭하는 패턴
            pattern_loose = first_eng + r'.*?' + last_eng
            try:
                match = re.search(pattern_loose, current_text_clean, re.DOTALL)
                if match:
                    matched_text = match.group(0)
                    new_text = current_text_clean.replace(matched_text, replacement_clean, 1)
                    print(clean_for_print(f"Step {step_idx} ({name}): Success (loose eng match)"))
                    return new_text
            except Exception as e:
                pass

    print(clean_for_print(f"Step {step_idx} ({name}): Failed to apply replace!"))
    print(clean_for_print(f"  Target Preview (length {len(target)}): {repr(target[:80])}"))
    return current_text

def replay_steps():
    with open(base_file, 'r', encoding='utf-8') as f:
        current_text = f.read()
        
    print(f"Loaded base file {base_file}, length: {len(current_text)}")
    
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
    
    for step_data in steps:
        step_idx = step_data["step"]
        name = step_data["name"]
        for chunk in step_data["chunks"]:
            current_text = apply_replace_robust(current_text, chunk["target"], chunk["replacement"], step_idx, name)
            
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(current_text)
        
    print(f"Replay completed. Restored file written to {output_file}. Length: {len(current_text)}")

if __name__ == '__main__':
    replay_steps()
