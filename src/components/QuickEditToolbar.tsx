import React, { useRef } from 'react';
import {
  BackgroundConfig,
  BrushConfig,
  SubjectCategory,
} from '../types';
import {
  COLOR_PRESETS,
  GRADIENT_PRESETS,
  PRESET_BACKGROUNDS,
} from '../utils/constants';
import {
  Palette,
  Eraser,
  Brush,
  Download,
  Upload,
  Sparkles,
  Sliders,
  SplitSquareVertical,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react';

interface QuickEditToolbarProps {
  viewMode: 'split' | 'canvas';
  setViewMode: (mode: 'split' | 'canvas') => void;
  backgroundConfig: BackgroundConfig;
  setBackgroundConfig: React.Dispatch<React.SetStateAction<BackgroundConfig>>;
  brushConfig: BrushConfig;
  setBrushConfig: React.Dispatch<React.SetStateAction<BrushConfig>>;
  activeToolTab: 'bg' | 'brush';
  setActiveToolTab: (tab: 'bg' | 'brush') => void;
  subjectCategory: SubjectCategory;
  onCategoryChange: (cat: SubjectCategory) => void;
  onReProcess: () => void;
  onDownloadPNG: () => void;
  onCopyToClipboard?: () => void;
  originalWidth: number;
  originalHeight: number;
  isProcessing: boolean;
}

export const QuickEditToolbar: React.FC<QuickEditToolbarProps> = ({
  viewMode,
  setViewMode,
  backgroundConfig,
  setBackgroundConfig,
  brushConfig,
  setBrushConfig,
  activeToolTab,
  setActiveToolTab,
  subjectCategory,
  onCategoryChange,
  onReProcess,
  onDownloadPNG,
  onCopyToClipboard,
  originalWidth,
  originalHeight,
  isProcessing,
}) => {
  const customBgInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setBackgroundConfig({
        ...backgroundConfig,
        type: 'image',
        imageUrl: url,
        imageName: file.name,
      });
    }
  };

  const handleCopy = () => {
    if (onCopyToClipboard) {
      onCopyToClipboard();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Top Bar of Toolbar: Mode Switcher & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'split'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-400" />
            <span>So sánh Trước / Sau</span>
          </button>
          <button
            onClick={() => {
              setViewMode('canvas');
              setActiveToolTab('brush');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'canvas'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Brush className="w-3.5 h-3.5 text-indigo-400" />
            <span>Chỉnh sửa cọ vẽ</span>
          </button>
        </div>

        {/* High-res info & Download Action */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-neutral-400 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg tabular-nums">
            <Maximize2 className="w-3 h-3 text-neutral-500" />
            <span>{originalWidth} × {originalHeight} px (Gốc)</span>
          </div>

          {onCopyToClipboard && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg transition-colors"
              title="Sao chép ảnh trong suốt vào bộ nhớ tạm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          )}

          <button
            onClick={onDownloadPNG}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải PNG Độ Nét Cao</span>
          </button>
        </div>
      </div>

      {/* Feature Tabs: Background vs Refine Brush */}
      <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-2">
        <button
          onClick={() => setActiveToolTab('bg')}
          className={`flex items-center gap-2 pb-1.5 text-xs font-semibold transition-colors relative ${
            activeToolTab === 'bg' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tùy chọn Phông Nền</span>
          {activeToolTab === 'bg' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveToolTab('brush');
            setViewMode('canvas');
          }}
          className={`flex items-center gap-2 pb-1.5 text-xs font-semibold transition-colors relative ml-4 ${
            activeToolTab === 'brush' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Brush className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cọ Xóa & Khôi Phục</span>
          {activeToolTab === 'brush' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1 Content: Background Selection */}
      {activeToolTab === 'bg' && (
        <div className="space-y-4">
          {/* Main Background Type Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'transparent' })}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                backgroundConfig.type === 'transparent'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div className="w-4 h-4 rounded bg-checkers border border-neutral-700 shrink-0" />
              <span>Trong suốt (PNG)</span>
            </button>

            <button
              onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'color' })}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                backgroundConfig.type === 'color'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div
                className="w-4 h-4 rounded border border-neutral-700 shrink-0"
                style={{ backgroundColor: backgroundConfig.color }}
              />
              <span>Màu đơn sắc</span>
            </button>

            <button
              onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'gradient' })}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                backgroundConfig.type === 'gradient'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div className="w-4 h-4 rounded bg-gradient-to-tr from-amber-300 via-pink-400 to-indigo-500 border border-neutral-700 shrink-0" />
              <span>Chuyển màu Studio</span>
            </button>

            <button
              onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'image' })}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                backgroundConfig.type === 'image'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div className="w-4 h-4 rounded bg-neutral-700 overflow-hidden shrink-0">
                {backgroundConfig.imageUrl && (
                  <img src={backgroundConfig.imageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <span>Ảnh nền cảnh quan</span>
            </button>

            <button
              onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'blur' })}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                backgroundConfig.type === 'blur'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Xóa phông Bokeh</span>
            </button>
          </div>

          {/* Sub-options based on type */}
          {backgroundConfig.type === 'color' && (
            <div className="flex flex-wrap items-center gap-2 pt-1 animate-fadeIn">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBackgroundConfig({ ...backgroundConfig, color: p.value })}
                  className={`group flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-all ${
                    backgroundConfig.color.toLowerCase() === p.value.toLowerCase()
                      ? 'border-indigo-500 bg-neutral-800 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0"
                    style={{ backgroundColor: p.value }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}

              {/* Custom Color input */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-neutral-800 bg-neutral-950">
                <span className="text-[11px] text-neutral-400">Tùy chọn:</span>
                <input
                  type="color"
                  value={backgroundConfig.color}
                  onChange={(e) => setBackgroundConfig({ ...backgroundConfig, color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[11px] font-mono text-neutral-300 uppercase">
                  {backgroundConfig.color}
                </span>
              </div>
            </div>
          )}

          {backgroundConfig.type === 'gradient' && (
            <div className="flex flex-wrap items-center gap-2.5 pt-1 animate-fadeIn">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setBackgroundConfig({ ...backgroundConfig, gradient: g.value })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    backgroundConfig.gradient === g.value
                      ? 'border-indigo-500 bg-neutral-800 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-md border border-neutral-700 shrink-0"
                    style={{ background: g.css }}
                  />
                  <span>{g.name}</span>
                </button>
              ))}
            </div>
          )}

          {backgroundConfig.type === 'image' && (
            <div className="flex flex-wrap items-center gap-3 pt-1 animate-fadeIn">
              {PRESET_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() =>
                    setBackgroundConfig({
                      ...backgroundConfig,
                      imageUrl: bg.url,
                      imageName: bg.title,
                    })
                  }
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs transition-all ${
                    backgroundConfig.imageUrl === bg.url
                      ? 'border-indigo-500 bg-neutral-800 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <img
                    src={bg.thumbnail}
                    alt={bg.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-7 object-cover rounded shrink-0 border border-neutral-700"
                  />
                  <span className="pr-1">{bg.title}</span>
                </button>
              ))}

              <input
                ref={customBgInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomBgUpload}
                className="hidden"
              />
              <button
                onClick={() => customBgInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-neutral-700 hover:border-indigo-500 bg-neutral-950 text-xs text-neutral-300 hover:text-white transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tải ảnh nền riêng</span>
              </button>
            </div>
          )}

          {backgroundConfig.type === 'blur' && (
            <div className="flex items-center gap-4 pt-1 max-w-md animate-fadeIn">
              <span className="text-xs text-neutral-300 whitespace-nowrap">Độ mờ hậu cảnh:</span>
              <input
                type="range"
                min="2"
                max="40"
                value={backgroundConfig.blurAmount}
                onChange={(e) =>
                  setBackgroundConfig({ ...backgroundConfig, blurAmount: Number(e.target.value) })
                }
                className="w-full accent-indigo-500"
              />
              <span className="font-mono text-xs tabular-nums text-indigo-400 w-12 text-right">
                {backgroundConfig.blurAmount}px
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2 Content: Refine Brush */}
      {activeToolTab === 'brush' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-wrap items-center gap-4">
            {/* Mode selection: Erase vs Restore */}
            <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
              <button
                onClick={() => setBrushConfig({ ...brushConfig, mode: 'erase' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  brushConfig.mode === 'erase'
                    ? 'bg-rose-950/70 border border-rose-600/50 text-rose-200'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Eraser className="w-3.5 h-3.5 text-rose-400" />
                <span>Cọ Xóa (Xóa mảng thừa)</span>
              </button>
              <button
                onClick={() => setBrushConfig({ ...brushConfig, mode: 'restore' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  brushConfig.mode === 'restore'
                    ? 'bg-emerald-950/70 border border-emerald-600/50 text-emerald-200'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Brush className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cọ Khôi phục (Lấy lại chủ thể)</span>
              </button>
            </div>

            {/* Brush Size slider */}
            <div className="flex items-center gap-2.5 min-w-[180px]">
              <span className="text-xs text-neutral-400 whitespace-nowrap">Cỡ cọ:</span>
              <input
                type="range"
                min="5"
                max="80"
                value={brushConfig.size}
                onChange={(e) =>
                  setBrushConfig({ ...brushConfig, size: Number(e.target.value) })
                }
                className="w-32 accent-indigo-500"
              />
              <span className="font-mono text-xs tabular-nums text-neutral-300 w-8">
                {brushConfig.size}px
              </span>
            </div>

            {/* Hardness / Edge softness */}
            <div className="flex items-center gap-2.5 min-w-[180px]">
              <span className="text-xs text-neutral-400 whitespace-nowrap">Độ mềm viền:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={brushConfig.hardness}
                onChange={(e) =>
                  setBrushConfig({ ...brushConfig, hardness: Number(e.target.value) })
                }
                className="w-28 accent-indigo-500"
              />
              <span className="font-mono text-xs tabular-nums text-neutral-300 w-10">
                {Math.round(brushConfig.hardness * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Category Refinement & Re-Run Trigger */}
      <div className="pt-2 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Gợi ý loại chủ thể AI:</span>
          <select
            value={subjectCategory}
            onChange={(e) => {
              onCategoryChange(e.target.value as SubjectCategory);
            }}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
          >
            <option value="auto">Tự động nhận diện</option>
            <option value="portrait">Chân dung & Người</option>
            <option value="product">Sản phẩm TMĐT</option>
            <option value="animal">Động vật / Thú cưng</option>
            <option value="graphic">Đồ hoạ & Logo</option>
          </select>
        </div>

        <button
          onClick={onReProcess}
          disabled={isProcessing}
          className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors flex items-center gap-1 font-medium"
        >
          <span>Chạy lại AI tách nền</span>
        </button>
      </div>
    </div>
  );
};
