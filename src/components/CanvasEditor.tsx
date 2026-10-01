import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BackgroundConfig, BrushConfig } from '../types';
import { applyBrushToMask, renderCompositedCanvas } from '../utils/aiSegmentation';
import { ZoomIn, ZoomOut, RotateCcw, Undo2, Redo2, Eye, EyeOff } from 'lucide-react';

interface CanvasEditorProps {
  originalImg: HTMLImageElement;
  rawMask: Uint8ClampedArray;
  onMaskUpdated: (newMask: Uint8ClampedArray) => void;
  backgroundConfig: BackgroundConfig;
  brushConfig: BrushConfig;
  brushActive: boolean;
  presetBgImages: Map<string, HTMLImageElement>;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  originalImg,
  rawMask,
  onMaskUpdated,
  backgroundConfig,
  brushConfig,
  brushActive,
  presetBgImages,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [isPainting, setIsPainting] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<Uint8ClampedArray[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showOriginal, setShowOriginal] = useState(false);

  // Initialize history with initial mask
  useEffect(() => {
    if (rawMask && history.length === 0) {
      const snapshot = new Uint8ClampedArray(rawMask.length);
      snapshot.set(rawMask);
      setHistory([snapshot]);
      setHistoryIndex(0);
    }
  }, [rawMask, history.length]);

  // Render canvas whenever mask or background changes
  useEffect(() => {
    if (!canvasRef.current || !originalImg || !rawMask) return;
    const canvas = canvasRef.current;

    if (showOriginal) {
      // Draw plain original
      const width = originalImg.naturalWidth || originalImg.width;
      const height = originalImg.naturalHeight || originalImg.height;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(originalImg, 0, 0);
      return;
    }

    const cachedBg = backgroundConfig.imageUrl
      ? presetBgImages.get(backgroundConfig.imageUrl)
      : null;

    renderCompositedCanvas(
      originalImg,
      rawMask,
      canvas,
      backgroundConfig,
      cachedBg
    );
  }, [originalImg, rawMask, backgroundConfig, presetBgImages, showOriginal]);

  // Coordinate mapping from mouse on scaled display element to native image pixels
  const getNativeCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    return { x, y, clientX: e.clientX, clientY: e.clientY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!brushActive || showOriginal) return;
    e.preventDefault();
    setIsPainting(true);

    const coords = getNativeCoords(e);
    if (!coords) return;

    paint(coords.x, coords.y);
  };

  const paint = useCallback(
    (nativeX: number, nativeY: number) => {
      if (!originalImg || !rawMask || !canvasRef.current) return;
      const width = originalImg.naturalWidth || originalImg.width;
      const height = originalImg.naturalHeight || originalImg.height;

      // Scale brush radius proportional to original high resolution
      // Standardize 1x brush size relative to 1000px dimension
      const baseDim = Math.max(width, height);
      const scaledRadius = Math.max(3, Math.round((brushConfig.size / 1000) * baseDim));

      applyBrushToMask(
        rawMask,
        width,
        height,
        nativeX,
        nativeY,
        scaledRadius,
        brushConfig.mode,
        brushConfig.hardness,
        brushConfig.opacity
      );

      // Re-render
      const cachedBg = backgroundConfig.imageUrl
        ? presetBgImages.get(backgroundConfig.imageUrl)
        : null;

      renderCompositedCanvas(
        originalImg,
        rawMask,
        canvasRef.current,
        backgroundConfig,
        cachedBg
      );
    },
    [originalImg, rawMask, brushConfig, backgroundConfig, presetBgImages]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getNativeCoords(e);
    if (coords) {
      setMousePos({ x: coords.clientX, y: coords.clientY });
      if (isPainting && brushActive && !showOriginal) {
        paint(coords.x, coords.y);
      }
    }
  };

  const handleMouseUp = () => {
    if (isPainting) {
      setIsPainting(false);
      // Save step to history
      const snapshot = new Uint8ClampedArray(rawMask.length);
      snapshot.set(rawMask);

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(snapshot);
      if (newHistory.length > 20) newHistory.shift();

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      onMaskUpdated(rawMask);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    if (isPainting) {
      handleMouseUp();
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevMask = history[newIndex];
      rawMask.set(prevMask);
      setHistoryIndex(newIndex);
      onMaskUpdated(rawMask);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextMask = history[newIndex];
      rawMask.set(nextMask);
      setHistoryIndex(newIndex);
      onMaskUpdated(rawMask);
    }
  };

  // Keyboard shortcut Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Top View Toolbar */}
      <div className="w-full flex items-center justify-between pb-2 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          {brushActive ? (
            <span className="text-indigo-400 font-medium flex items-center gap-1.5">
              <span>Đang bật cọ:</span>
              <span className="text-white">
                {brushConfig.mode === 'erase' ? 'Xóa mảng thừa' : 'Khôi phục chủ thể'}
              </span>
              <span>(Rê chuột trên ảnh để vẽ)</span>
            </span>
          ) : (
            <span>Xem trước thời gian thực</span>
          )}
        </div>

        {/* Undo / Redo & Zoom Controls */}
        <div className="flex items-center gap-2">
          {brushActive && (
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 mr-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Hoàn tác (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Làm lại (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-colors"
            title="Nhấn và giữ để xem ảnh gốc"
          >
            {showOriginal ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
            <span className="text-[11px]">Giữ để xem gốc</span>
          </button>

          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
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
                className="p-1 hover:text-white text-indigo-400 transition-colors border-l border-neutral-800 pl-1"
                title="Đặt lại 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full overflow-auto max-h-[68vh] rounded-xl border border-neutral-800 flex items-center justify-center p-3 bg-neutral-950/70"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPainting ? 'none' : 'transform 0.12s ease-out',
          }}
          className={`relative rounded-lg shadow-2xl overflow-hidden max-w-full inline-block ${
            backgroundConfig.type === 'transparent' ? 'bg-checkers' : ''
          }`}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`block max-h-[60vh] w-auto max-w-full object-contain ${
              brushActive ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Floating Brush Ring Cursor Indicator */}
      {brushActive && mousePos && (
        <div
          className="fixed pointer-events-none rounded-full border border-indigo-400 bg-indigo-400/20 -translate-x-1/2 -translate-y-1/2 z-50 transition-none"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            width: `${Math.max(10, brushConfig.size * 1.5 * zoom)}px`,
            height: `${Math.max(10, brushConfig.size * 1.5 * zoom)}px`,
          }}
        />
      )}
    </div>
  );
};
