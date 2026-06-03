const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || ''

export const geminiClient = {
  getApiKey: (): string => GEMINI_API_KEY,
  
  /**
   * Generates text content using Gemini 1.5 Flash API via REST
   */
  generateText: async (prompt: string): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key is not configured.')
      return 'API Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.'
    }
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      )
      
      if (!response.ok) {
        throw new Error(`Gemini API Request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성하지 못했습니다.'
    } catch (error) {
      console.error('Error generating content from Gemini:', error)
      return `Gemini API 호출 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
