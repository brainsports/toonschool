const DEFAULT_TITLE = '툰스쿨 - ToonSchool'
const DEFAULT_DESCRIPTION = '웹툰으로 배우는 인터랙티브 교육 플랫폼, 툰스쿨입니다.'

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const replaceMetaContent = (html, attribute, key, content) => {
  const escapedContent = escapeHtml(content)
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i')
  const replacement = `<meta ${attribute}="${key}" content="${escapedContent}" />`
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace('</head>', `  ${replacement}\n</head>`)
}

const replaceTitle = (html, title) => {
  const replacement = `<title>${escapeHtml(title)}</title>`
  return /<title>.*?<\/title>/is.test(html)
    ? html.replace(/<title>.*?<\/title>/is, replacement)
    : html.replace('</head>', `  ${replacement}\n</head>`)
}

const getRequestOrigin = (request) => {
  const forwardedHost = request.headers['x-forwarded-host']
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || request.headers.host
  const forwardedProto = request.headers['x-forwarded-proto']
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || 'https'
  return `${protocol}://${host}`
}

const getShareId = (request) => {
  const value = request.query?.shareId
  return Array.isArray(value) ? value[0] : value
}

const getComicMetadata = async (shareId) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  const query = new URLSearchParams({
    slug: `eq.${shareId}`,
    is_public: 'eq.true',
    select: 'title,subject,student_name',
    limit: '1',
  })
  const response = await fetch(`${supabaseUrl}/rest/v1/shared_comic_books?${query}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  })
  if (!response.ok) return null

  const [comic] = await response.json()
  return comic || null
}

export default async function handler(request, response) {
  const origin = getRequestOrigin(request)
  const shareId = getShareId(request)

  try {
    const [indexResponse, comic] = await Promise.all([
      fetch(`${origin}/`),
      shareId ? getComicMetadata(shareId) : Promise.resolve(null),
    ])
    if (!indexResponse.ok) throw new Error(`index.html 응답 실패: ${indexResponse.status}`)

    let html = await indexResponse.text()
    const studentName = comic?.student_name?.trim() || '학생'
    const subject = comic?.subject?.trim() || '재미있는'
    const comicTitle = comic?.title?.trim() || '툰스쿨 만화'
    const title = comic ? `${studentName}의 ${subject} 학습만화 | ${comicTitle}` : DEFAULT_TITLE
    const description = comic
      ? `${studentName} 학생이 만든 ${subject} 학습만화 '${comicTitle}'을 툰스쿨에서 만나보세요.`
      : DEFAULT_DESCRIPTION
    const canonicalUrl = shareId ? `${origin}/book/${encodeURIComponent(shareId)}` : origin

    html = replaceTitle(html, title)
    html = replaceMetaContent(html, 'name', 'description', description)
    html = replaceMetaContent(html, 'property', 'og:title', title)
    html = replaceMetaContent(html, 'property', 'og:description', description)
    html = replaceMetaContent(html, 'property', 'og:url', canonicalUrl)
    html = replaceMetaContent(html, 'name', 'twitter:title', title)
    html = replaceMetaContent(html, 'name', 'twitter:description', description)

    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    return response.status(200).send(html)
  } catch (error) {
    console.error('[book-meta] OG 메타데이터 응답 실패', error)
    return response.redirect(307, '/')
  }
}
