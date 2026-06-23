const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
const GEMINI_MODEL = 'gemini-3.5-flash'
const IMAGEN_MODEL = 'imagen-4.0-fast-generate-001'

export const geminiClient = {
  getApiKey: (): string => GEMINI_API_KEY,
  
  /**
   * Generates text content using Gemini API via REST
   */
  generateText: async (prompt: string): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key is not configured.')
      throw new Error('API Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.')
    }
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
      
      // 사용자의 요청에 따라 참조 이미지를 payload에 포함합니다.
      // 모델에 따라 referenceImages 필드를 지원하거나 무시할 수 있습니다.
      if (referenceImages && referenceImages.length > 0) {
        instanceData.referenceImages = referenceImages;
      }

      const payload = {
        instances: [ instanceData ],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio,
          outputOptions: {
            mimeType: "image/jpeg"
          }
        }
      };

      console.log('Gemini Imagen API Payload:', JSON.stringify(payload).substring(0, 500) + '... [TRUNCATED]');

      let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Imagen API HTTP Error: ${response.status}`, errorText);

        // Fallback 처리: 참조 이미지 관련 오류 발생 시 참조 이미지 제외 후 재시도
        if (
          errorText.includes('Invalid reference type') || 
          errorText.includes('referenceImages') || 
          response.status === 400
        ) {
          console.warn('참조 이미지(referenceImages) 지원하지 않는 모델/스키마이므로 제외하고 Fallback 재시도합니다.');
          const fallbackPayload = {
            instances: [ { prompt: prompt + "\n하나 선생님, 도윤, 서아는 툰스쿨 v2 공식 캐릭터 기준으로 동일한 외형을 유지한다. 머리 모양, 얼굴형, 옷 스타일, 색감, 비율을 컷마다 바꾸지 않는다. 새 캐릭터를 만들지 않는다." } ],
            parameters: payload.parameters
          };
          
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fallbackPayload),
            }
          );

          if (!response.ok) {
             const fallbackErrorText = await response.text();
             console.error(`Imagen API Fallback HTTP Error: ${response.status}`, fallbackErrorText);
             throw new Error(`이미지 생성 API 요청 실패 (상태: ${response.status})`);
          }
        } else {
          throw new Error(`이미지 생성 API 요청 실패 (상태: ${response.status})`);
        }
      }
      
      const data = await response.json();
      const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
      if (!base64Image) {
        console.error('Imagen API Unexpected Response Format:', data);
        throw new Error('이미지를 생성하지 못했습니다. (데이터 형식 오류)');
      }
      return `data:image/jpeg;base64,${base64Image}`;
    } catch (error) {
      console.error('Error generating image from Imagen:', error);
      throw error
    }
  }
}
