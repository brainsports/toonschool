/**
 * 툰마인드 PNG/PDF/썸네일 내보내기.
 *
 * 주의(html2canvas + Tailwind v4): Tailwind v4 색상 유틸리티는 oklch 로 컴파일되며,
 * html2canvas(1.x)는 oklch 를 파싱하지 못해 오류를 낸다. 따라서 캡처 대상 노드는
 * Tailwind 색상 클래스 대신 인라인 hex/rgb 스타일(테마 팔레트)로 그려야 한다.
 * 본 에디터의 노드/배경은 모두 인라인 hex 기반이므로 안전하다.
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

async function renderToCanvas(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    backgroundColor: '#ffffff',
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    // oklch 방어: html2canvas 가 모르는 색 함수를 만나면 치환하지 못하므로,
    // 캡처 노드 자체가 hex 인라인 스타일만 쓰도록 구성한다(에디터 컴포넌트 참고).
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      type,
      quality
    );
  });
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function safeFileName(title: string, ext: string): string {
  const base = (title || '툰마인드').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 40).trim() || '툰마인드';
  return `${base}.${ext}`;
}

export async function exportPng(el: HTMLElement, title: string, scale = 2): Promise<void> {
  const canvas = await renderToCanvas(el, scale);
  const blob = await canvasToBlob(canvas, 'image/png');
  triggerDownload(blob, safeFileName(title, 'png'));
}

export async function elementToDataUrl(el: HTMLElement, scale = 1.4, type = 'image/jpeg', quality = 0.85): Promise<string> {
  const canvas = await renderToCanvas(el, scale);
  return canvas.toDataURL(type, quality);
}

/** 썸네일용 작은 데이터 URL(목록/공유 카드). */
export async function makeThumbnailDataUrl(el: HTMLElement): Promise<string> {
  return elementToDataUrl(el, 1, 'image/jpeg', 0.8);
}

export async function exportPdf(el: HTMLElement, title: string, scale = 2): Promise<void> {
  const canvas = await renderToCanvas(el, scale);
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const wPx = canvas.width;
  const hPx = canvas.height;
  const orientation = wPx >= hPx ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [wPx, hPx], compress: true });
  pdf.addImage(imgData, 'JPEG', 0, 0, wPx, hPx);
  pdf.save(safeFileName(title, 'pdf'));
}

/** 인쇄: 새 창에 이미지를 넣어 인쇄 다이얼로그. */
export async function printMindmap(el: HTMLElement, title: string): Promise<void> {
  const canvas = await renderToCanvas(el, 2);
  const dataUrl = canvas.toDataURL('image/png');
  const win = window.open('', '_blank', 'width=1000,height=700');
  if (!win) {
    alert('팝업이 차단되었어요. 팝업을 허용한 뒤 다시 시도해 주세요.');
    return;
  }
  win.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>
  <style>@page{margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block;max-width:100%;height:auto;margin:0 auto}</style>
  </head><body><img src="${dataUrl}" onload="window.focus();window.print();" /></body></html>`);
  win.document.close();
}
