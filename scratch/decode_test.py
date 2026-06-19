def try_restore_and_check(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    text = text.lstrip('\ufeff')
    try:
        raw = text.encode('cp949', errors='ignore')
        restored = raw.decode('utf-8', errors='replace')
        
        # '과학' 이나 다른 한글 키워드가 복구되었는지 확인
        print(f"--- Results for {file_path} ---")
        lines = restored.split('\n')
        for i, line in enumerate(lines):
            if '과학' in line or '국어' in line or '영어' in line or '사회' in line or '수학' in line:
                print(f"Line {i+1}: {line}")
        return restored
    except Exception as e:
        print("Restore fail:", e)

try_restore_and_check('git_diff_utf8.txt')
