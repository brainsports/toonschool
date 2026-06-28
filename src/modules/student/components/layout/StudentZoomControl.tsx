import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'

interface StudentZoomControlProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen?: () => void
  minScale?: number
  maxScale?: number
}

export default function StudentZoomControl({
  scale,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  minScale = 0.5,
  maxScale = 2.0
}: StudentZoomControlProps) {
  return (
    <div className="absolute right-6 bottom-6 flex items-center gap-2 bg-[#090911] rounded-2xl shadow-lg p-2 z-20">
      <button
        onClick={onZoomOut}
        disabled={scale <= minScale}
        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      <div className="w-16 text-center font-jua text-white text-lg tracking-wider">
        {Math.round(scale * 100)}%
      </div>

      <button
        onClick={onZoomIn}
        disabled={scale >= maxScale}
        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      {onFitToScreen && (
        <>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <button
            onClick={onFitToScreen}
            className="px-3 h-10 flex items-center justify-center gap-1.5 text-white hover:bg-white/10 rounded-xl transition-colors font-jua"
          >
            <Maximize className="w-4 h-4" />
            <span>화면맞춤</span>
          </button>
        </>
      )}
    </div>
  )
}
