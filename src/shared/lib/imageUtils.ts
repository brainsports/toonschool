/**
 * Compresses a base64 image data URL using Canvas API.
 * 
 * @param dataUrl - Original base64 image data URL
 * @param maxWidth - Maximum width of the compressed image
 * @param quality - Compression quality (0.0 to 1.0)
 * @returns A promise that resolves to the compressed base64 data URL
 */
export const compressImageDataUrl = (dataUrl: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.floor(height * (maxWidth / width));
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Draw white background in case of transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Draw image with new dimensions
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use image/jpeg for smaller file size
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = dataUrl;
  });
};
