def restore_git_diff():
    # 1. git_diff.txt를 UTF-16LE로 직접 연다
    with open('git_diff.txt', 'r', encoding='utf-16') as f:
        broken_text = f.read()
    
    print("Broken text length:", len(broken_text))
    
    # 2. 깨진 텍스트를 한 글자씩 cp949로 인코드 해보고, 안 되는 글자는 무시하거나 변환해본다
    restored_chars = []
    for char in broken_text:
        try:
            # 개별 문자를 cp949로 인코드 후 utf-8로 디코드 시도
            b = char.encode('cp949')
            # 만약 cp949 바이트가 정상적이라면 utf-8 디코드를 시도
            # 다만 한 글자씩 디코드하면 멀티바이트 글자의 경우 실패하므로, 바이트들을 모아서 처리해야 합니다.
            restored_chars.append(b)
        except UnicodeEncodeError:
            # cp949로 인코딩이 안 되는 글자 (예: 원래 영어/숫자/유니코드 기호였을 것)는 
            # 그 문자 자체의 utf-8 바이트를 사용하거나 그냥 문자를 유지
            restored_chars.append(char.encode('utf-8', errors='ignore'))
            
    # 바이트들을 합친다
    raw_bytes = b"".join(restored_chars)
    
    # 이제 이 raw_bytes를 utf-8로 디코드해본다
    # 하지만 cp949로 인코드했을 때 이미 꼬인 바이트가 섞여있어서 전체 디코드가 깨질 수 있으므로 errors='replace'를 준다
    restored_text = raw_bytes.decode('utf-8', errors='replace')
    
    print("Restored Text Preview:")
    print(restored_text[:800])
    
    # 파일로 저장
    with open('git_diff_restored.txt', 'w', encoding='utf-8') as f:
        f.write(restored_text)

restore_git_diff()
