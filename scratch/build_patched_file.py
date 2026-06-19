import re

def build_file_from_diff(diff_file, output_file):
    with open(diff_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    out_lines = []
    
    # diff 헤더 스킵 플래그
    in_hunk = False
    
    for line in lines:
        line_raw = line.replace('\r\n', '\n').replace('\n', '')
        
        # Hunk 헤더 시작 감지
        if line_raw.startswith('@@'):
            in_hunk = True
            continue
            
        if not in_hunk:
            # 헤더 영역은 무시
            continue
            
        # Hunk 내부 처리
        if line_raw.startswith('-'):
            # 지워진 라인은 결과물에 포함하지 않음
            continue
        elif line_raw.startswith('+'):
            # 추가된 라인은 +를 떼고 포함
            out_lines.append(line_raw[1:])
        elif line_raw.startswith('\\'):
            # No newline at end of file 등 무시
            continue
        else:
            # unchanged 라인 (공백으로 시작하거나 빈 줄)
            # 보통 unchanged 라인은 공백 한 칸이 붙어 있음
            if line_raw.startswith(' '):
                out_lines.append(line_raw[1:])
            else:
                out_lines.append(line_raw)
                
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out_lines))
        
    print(f"Successfully reconstructed {output_file} from diff. Total lines: {len(out_lines)}")

build_file_from_diff('git_diff_restored.txt', 'src/modules/toon/pages/ToonEditor.tsx')
