// src/modules/student/utils/toast.ts

export function showToast(message: string, duration: number = 3000) {
  // 중복된 토스트 제거
  const existingToast = document.getElementById('student-toast-container');
  if (existingToast) {
    existingToast.remove();
  }

  // 컨테이너 생성
  const container = document.createElement('div');
  container.id = 'student-toast-container';
  container.style.position = 'fixed';
  container.style.bottom = '40px';
  container.style.left = '50%';
  container.style.transform = 'translateX(-50%)';
  container.style.zIndex = '9999';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.pointerEvents = 'none';

  // 토스트 요소 생성
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.background = 'rgba(56, 43, 92, 0.9)'; // 툰스쿨 어두운 보라색 계열
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '30px';
  toast.style.fontSize = '16px';
  toast.style.fontFamily = '"Jua", sans-serif';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

  container.appendChild(toast);
  document.body.appendChild(container);

  // 애니메이션 실행 (등장)
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // 애니메이션 실행 (퇴장)
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    
    // DOM 제거
    setTimeout(() => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 300);
  }, duration);
}
