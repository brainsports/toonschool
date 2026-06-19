import React, { useRef, useCallback, useState, useEffect } from 'react'

interface ResizableLeftPanelProps {
  children: React.ReactNode
}

export default function ResizableLeftPanel({ children }: ResizableLeftPanelProps) {
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('toon-editor-panel-width')
    return saved ? parseInt(saved, 10) : 320
  })

  const isResizingRef = useRef(false)

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return
    const newWidth = Math.max(260, Math.min(520, e.clientX))
    setPanelWidth(newWidth)
  }, [])

  const stopResize = useCallback(() => {
    isResizingRef.current = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    setPanelWidth(current => {
      localStorage.setItem('toon-editor-panel-width', current.toString())
      return current
    })
  }, [handleResize])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }, [handleResize, stopResize])

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
    }
  }, [handleResize, stopResize])

  return (
    <aside 
      style={{ width: panelWidth, position: 'relative', display: 'flex', flexDirection: 'column' }} 
      className="bg-white border-r border-[#E2E8F0] flex-shrink-0"
    >
      <div className="flex-1 overflow-y-auto flex flex-col">
        {children}
      </div>
      
      {/* 세로 리사이즈 핸들 - 태블릿 고려하여 충분한 클릭 가능 영역(12px) 확보 */}
      <div
        onMouseDown={startResize}
        style={{
          position: 'absolute',
          top: 0,
          right: -6,
          width: 12,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 50,
          userSelect: 'none',
          touchAction: 'none',
          background: 'transparent'
        }}
        className="group"
      >
        {/* 호버 시 시각적 구분선 */}
        <div className="w-[4px] h-full mx-auto bg-transparent group-hover:bg-[#4F6AF0]/40 transition-colors" />
      </div>
    </aside>
  )
}
