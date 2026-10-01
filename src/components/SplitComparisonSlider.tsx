import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronsLeftRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SplitComparisonSliderProps {
  originalSrc: string;
  resultCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  resultDataUrl?: string | null;
  width: number;
  height: number;
  alt?: string;
}

export const SplitComparisonSlider: React.FC<SplitComparisonSliderProps> = ({
  originalSrc,
  resultDataUrl,
  width,
  height,
  alt = 'So sánh trước sau',
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Zoom and view toolbar */}
      <div className="w-full flex items-center justify-between pb-2 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span>Kéo thanh trượt để so sánh viền cắt</span>
        </div>
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            disabled={zoom <= 0.5}
            className="p-1 hover:text-white disabled:opacity-30 transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1 font-mono text-[11px] tabular-nums text-neutral-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
            disabled={zoom >= 3}
            className="p-1 hover:text-white disabled:opacity-30 transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom !== 1 && (
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:text-white text-indigo-400 transition-colors border-l border-neutral-800 pl-1.5"
              title="Đặt lại zoom 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Comparison Container */}
      <div className="w-full overflow-auto max-h-[68vh] rounded-xl border border-neutral-800 flex items-center justify-center p-2 bg-neutral-950/60">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative select-none cursor-ew-resize overflow-hidden rounded-lg shadow-2xl inline-block max-w-full"
        >
          {/* Layer 1: Background & Cutout Result (Right / Full background) */}
          <div className="relative bg-checkers">
            <img
              src={resultDataUrl || originalSrc}
              alt={alt}
              referrerPolicy="no-referrer"
              className="block max-h-[60vh] w-auto max-w-full object-contain pointer-events-none"
            />
          </div>

          {/* Layer 2: Original Image (Clipped by slider position) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={originalSrc}
              alt="Ảnh gốc"
              referrerPolicy="no-referrer"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : 'auto',
                maxWidth: 'none',
              }}
              className="block max-h-[60vh] h-full object-contain"
            />
          </div>

          {/* Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="h-full w-0.5 bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.6)] relative -translate-x-1/2">
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-neutral-900 shadow-xl flex items-center justify-center border-2 border-neutral-900">
                <ChevronsLeftRight className="w-4 h-4 text-neutral-800" />
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[11px] font-medium text-white/90 pointer-events-none">
            Ảnh gốc
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-indigo-950/70 border border-indigo-500/30 backdrop-blur-md rounded text-[11px] font-medium text-indigo-200 pointer-events-none">
            Đã tách nền
          </div>
        </div>
      </div>
    </div>
  );
};
