import re

with open('src/modules/student/pages/StudentComicViewerPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('export default function StudentComicViewerPage() {', 'export default function SharedComicViewerPage() {')

content = content.replace("import { useNavigate, useLocation } from 'react-router-dom'", "import { useNavigate, useParams } from 'react-router-dom'")

state_retrieval_pattern = r"const stateProjectId = location\.state\?\.projectId;[\s\S]*?const currentProjectId = stateProjectId \|\| legacyTopicId \|\| localStorage\.getItem\('currentProjectId'\);"
state_retrieval_repl = """const { slug } = useParams();
    const currentProjectId = localStorage.getItem(`shared_slug_${slug}`);"""
content = re.sub(state_retrieval_pattern, state_retrieval_repl, content)

content = content.replace('}, [location.state])', '}, [slug])')

# Extract StudentWorkspaceLayout starting tag and end tag
# We can use a simpler approach: just find the index of <StudentWorkspaceLayout
# and the index of > after it.
start_idx = content.find('<StudentWorkspaceLayout')
if start_idx != -1:
    end_tag_idx = content.find('>', start_idx)
    content = content[:start_idx] + '<div className="w-full h-[100dvh] relative overflow-hidden bg-[#f3f4f7] flex flex-col">' + content[end_tag_idx + 1:]

content = content.replace('</StudentWorkspaceLayout>', '</div>')

with open('src/modules/student/pages/SharedComicViewerPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
