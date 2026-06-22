const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || ''

export const geminiClient = {
  getApiKey: (): string => GEMINI_API_KEY,
  
  /**
   * Generates text content using Gemini 1.5 Flash API via REST
   */
  generateText: async (prompt: string): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key is not configured.')
      throw new Error('API Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.')
    }
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        const errorText = await response.text()
        console.error(`Gemini API HTTP Error: ${response.status}`, errorText)
        throw new Error(`Gemini API Request failed with status ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        console.error('Gemini API Unexpected Response Format:', data)
        throw new Error('응답을 생성하지 못했습니다. (데이터 형식 오류)')
      }
      return text
    } catch (error) {
      console.error('Error generating content from Gemini:', error)
      throw error
    }
  },

  /**
   * Generates an image using Imagen 4 API via REST
   */
  generateImage: async (prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' = '3:4', referenceImages?: any[]): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key is not configured.')
      throw new Error('API Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.')
    }
    
    try {
      const instanceData: any = { prompt: prompt };
      
      // [주의] 현재 사용 중인 AI Studio (generativelanguage.googleapis.com)의
      // imagen-4.0-fast-generate-001 모델은 predict 엔드포인트에서 
      // referenceImages(Subject 참조) 필드를 지원하지 않습니다. (Vertex AI 전용 기능)
      // 따라서 API 400 Bad Request 오류를 방지하기 위해 payload에 추가하지 않습니다.
      if (referenceImages && referenceImages.length > 0) {
        console.warn(`참조 이미지 ${referenceImages.length}장이 전달되었으나, 현재 모델 API 스키마에서 미지원하므로 payload에서 제외합니다.`);
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [ instanceData ],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio,
              outputOptions: {
                mimeType: "image/jpeg"
              }
            }
          }),
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Imagen API HTTP Error: ${response.status}`, errorText)
        throw new Error(`이미지 생성 API 요청 실패 (상태: ${response.status})`)
      }
      
      const data = await response.json()
      const base64Image = data.predictions?.[0]?.bytesBase64Encoded
      if (!base64Image) {
        console.error('Imagen API Unexpected Response Format:', data)
        throw new Error('이미지를 생성하지 못했습니다. (데이터 형식 오류)')
      }
      return `data:image/jpeg;base64,${base64Image}`
    } catch (error) {
      console.error('Error generating image from Imagen:', error)
      throw error
    }
  }
}
