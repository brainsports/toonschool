import re

with open('git_diff_restored.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# 개행 문자 제거
content = content.replace('\r\n', '\n')

# @@ -xx,xx +xx,xx @@ 매치 찾기
pattern = r'@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@'
matches = list(re.finditer(pattern, content))

print(f"Number of @@ matches: {len(matches)}")
for i, m in enumerate(matches):
    print(f"Match {i+1}: '{m.group()}' at position {m.start()} to {m.end()}")
    # 앞뒤 40자 출력
    start = max(0, m.start() - 20)
    end = min(len(content), m.end() + 20)
    print(f"  Context: {repr(content[start:end])}")
