import sys
import re

# 터미널 한글 깨짐 방지
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def parse_and_apply_patch(target_file, diff_file, output_file):
    # 원본 파일 읽기
    with open(target_file, 'r', encoding='utf-8') as f:
        target_content = f.read().replace('\r\n', '\n')
    target_lines = target_content.split('\n')

    # diff 파일 읽기
    with open(diff_file, 'r', encoding='utf-8') as f:
        diff_content = f.read().replace('\r\n', '\n')

    # hunk 분리
    # diff header와 hunk들을 분리하기 위해 @@ 패턴을 기준으로 split
    hunk_pattern = r'\n(@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@)'
    parts = re.split(hunk_pattern, diff_content)
    
    # parts[0]은 diff header
    # 그 후로는 (hunk_header, hunk_body) 쌍으로 나옴
    hunks = []
    for i in range(1, len(parts), 2):
        header = parts[i]
        body = parts[i+1] if i+1 < len(parts) else ""
        hunks.append((header, body))
        
    print(f"Parsed {len(hunks)} hunks from diff.")

    # hunk들을 적용
    # 순서대로 적용하되, 라인 번호가 shift 될 수 있으므로 뒤에서부터 적용하거나
    # 또는 원본 라인 매칭을 통해 적용
    new_lines = list(target_lines)
    
    # 각 hunk 분석
    for idx, (header, body) in enumerate(hunks):
        print(f"\n--- Processing Hunk {idx+1}: {header} ---")
        # header 파싱: @@ -start,len +start,len @@
        match = re.match(r'@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@', header)
        if not match:
            print("Failed to parse header:", header)
            continue
            
        old_start = int(match.group(1))
        old_len = int(match.group(2)) if match.group(2) else 1
        new_start = int(match.group(3))
        new_len = int(match.group(4)) if match.group(4) else 1
        
        print(f"Old range: L{old_start} to L{old_start + old_len - 1} ({old_len} lines)")
        print(f"New range: L{new_start} to L{new_start + new_len - 1} ({new_len} lines)")
        
        # hunk body 분석
        body_lines = body.split('\n')
        if body_lines and not body_lines[-1]:
            body_lines = body_lines[:-1]
            
        # - 와 + 라인 분리
        minus_lines = []
        plus_lines = []
        context_lines = []
        
        for bl in body_lines:
            if bl.startswith('-'):
                minus_lines.append(bl[1:])
            elif bl.startswith('+'):
                plus_lines.append(bl[1:])
            elif bl.startswith('\\'):
                continue
            else:
                # 공통 context 라인
                val = bl[1:] if bl.startswith(' ') else bl
                minus_lines.append(val)
                plus_lines.append(val)
        
        # 원본 파일에서 old_start-1 부터의 영역이 minus_lines와 매치되는지 확인
        # (1-indexed 라서 index = old_start - 1)
        target_sub_idx = old_start - 1
        target_sub = target_lines[target_sub_idx : target_sub_idx + old_len]
        
        # 비교를 위해 개행문자나 앞뒤 공백 제거
        target_sub_clean = [l.strip() for l in target_sub]
        minus_clean = [l.strip() for l in minus_lines]
        
        # 완전히 일치하는지 또는 유사한지 검사
        match_ok = True
        if len(target_sub_clean) != len(minus_clean):
            print(f"Length mismatch: Target subsegment is {len(target_sub_clean)} lines, but minus has {len(minus_clean)} lines")
            match_ok = False
        else:
            for l_idx, (t_line, m_line) in enumerate(zip(target_sub_clean, minus_clean)):
                # 한글 깨짐 때문에 완전 일치는 안 될 수 있으므로 영어와 특수문자 위주로 매칭해보거나
                # 또는 그냥 1-indexed 범위를 강제 신뢰할 수도 있습니다.
                # 일단 비교 출력
                if t_line != m_line:
                    # 한글 깨진 글자 차이인지 확인하기 위해 영어만 추출해서 비교
                    t_eng = re.sub(r'[^a-zA-Z0-9_]', '', t_line)
                    m_eng = re.sub(r'[^a-zA-Z0-9_]', '', m_line)
                    if t_eng != m_eng:
                        print(f"Line mismatch at relative index {l_idx}:")
                        print(f"  Target: {repr(t_line)}")
                        print(f"  Minus:  {repr(m_line)}")
                        match_ok = False
                        break
        
        if match_ok:
            print(f"Hunk {idx+1} verified! Applying replacement.")
        else:
            print(f"Hunk {idx+1} verification failed. We will force apply using line range L{old_start} to L{old_start + old_len - 1}")
            
        # 강제로든 매치되어서든 새 라인들로 대체할 내용을 구성합니다.
        # target_lines에서 [old_start-1 : old_start-1+old_len] 부분을 plus_lines로 교체하기 위해 표시
        # 나중에 한 번에 교체하기 위해 replace map을 만듭니다.
        # tuple 형식으로 (old_start-1, old_len, plus_lines) 저장
        hunks[idx] = (old_start - 1, old_len, plus_lines)

    # 역순으로 교체 (앞에서부터 바꾸면 인덱스가 밀림)
    # 중복 교체를 피하기 위해 인덱스가 겹치지 않게 정렬
    hunks_to_apply = [h for h in hunks if isinstance(h, tuple) and len(h) == 3]
    hunks_to_apply.sort(key=lambda x: x[0], reverse=True)
    
    for start_idx, length, replacement in hunks_to_apply:
        target_lines[start_idx : start_idx + length] = replacement
        
    final_content = "\n".join(target_lines)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"\nSuccessfully wrote patched file to {output_file}. Total lines: {len(target_lines)}")

parse_and_apply_patch('src/modules/toon/pages/ToonEditor.tsx', 'git_diff_restored.txt', 'src/modules/toon/pages/ToonEditor.tsx')
