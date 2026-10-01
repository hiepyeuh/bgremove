import React from 'react';
import { ImageItem, BackgroundConfig } from '../types';
import {
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit3,
  Archive,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface BatchProcessorProps {
  items: ImageItem[];
  onProcessAll: () => void;
  onProcessSingle: (id: string) => void;
  onEditItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onDownloadItem: (item: ImageItem) => void;
  onDownloadAllZip: () => void;
  onClearAll: () => void;
  isProcessingBatch: boolean;
  batchProgress: number; // 0 to 100
  globalBgConfig: BackgroundConfig;
  setGlobalBgConfig: (config: BackgroundConfig) => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  items,
  onProcessAll,
  onProcessSingle,
  onEditItem,
  onRemoveItem,
  onDownloadItem,
  onDownloadAllZip,
  onClearAll,
  isProcessingBatch,
  batchProgress,
  globalBgConfig,
  setGlobalBgConfig,
}) => {
  const completedCount = items.filter((i) => i.status === 'done').length;
  const pendingCount = items.filter((i) => i.status === 'idle' || i.status === 'error').length;
  const hasFinished = completedCount > 0;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Batch Header Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Xử Lý Hàng Loạt</span>
            <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {completedCount}/{items.length} hoàn thành
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Tách nền nhiều ảnh cùng lúc, giữ nguyên độ phân giải 100% của từng ảnh và tải về trọn bộ file ZIP.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {items.length > 0 && (
            <button
              onClick={onClearAll}
              disabled={isProcessingBatch}
              className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors disabled:opacity-40"
            >
              Xóa tất cả
            </button>
          )}

          <button
            onClick={onProcessAll}
            disabled={isProcessingBatch || pendingCount === 0}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {isProcessingBatch ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý ({Math.round(batchProgress)}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Xử lý tất cả ({pendingCount})</span>
              </>
            )}
          </button>

          <button
            onClick={onDownloadAllZip}
            disabled={!hasFinished || isProcessingBatch}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-40 whitespace-nowrap"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Tải Tất Cả (.ZIP)</span>
          </button>
        </div>
      </div>

      {/* Global Batch Background Preset */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">Nền áp dụng cho toàn bộ lô:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setGlobalBgConfig({ ...globalBgConfig, type: 'transparent' })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              globalBgConfig.type === 'transparent'
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="w-3 h-3 bg-checkers rounded-xs" />
            <span>Trong suốt (PNG)</span>
          </button>

          <button
            onClick={() =>
              setGlobalBgConfig({ ...globalBgConfig, type: 'color', color: '#FFFFFF' })
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              globalBgConfig.type === 'color' && globalBgConfig.color === '#FFFFFF'
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="w-3 h-3 bg-white rounded-xs" />
            <span>Trắng TMĐT</span>
          </button>

          <button
            onClick={() =>
              setGlobalBgConfig({ ...globalBgConfig, type: 'color', color: '#0055A5' })
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              globalBgConfig.type === 'color' && globalBgConfig.color === '#0055A5'
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            <div className="w-3 h-3 bg-[#0055A5] rounded-xs" />
            <span>Xanh ảnh thẻ</span>
          </button>
        </div>
      </div>

      {/* Batch Overall Progress Bar */}
      {isProcessingBatch && (
        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span>Tiến độ xử lý hàng loạt:</span>
            <span className="font-mono tabular-nums text-indigo-400">
              {Math.round(batchProgress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${batchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items List Table / Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-neutral-800/80">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-850/50 transition-colors"
            >
              {/* Left Column: Thumb & Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Thumbnail Preview */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-checkers shrink-0 border border-neutral-800">
                  <img
                    src={item.resultUrl || item.originalUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {item.status === 'done' && (
                    <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5 shadow">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-white truncate">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    <span className="font-mono tabular-nums">
                      {item.originalWidth} × {item.originalHeight} px
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                    {item.aiAnalysis?.subjectName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-indigo-400 truncate max-w-[140px]">
                          {item.aiAnalysis.subjectName}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    {item.status === 'idle' && (
                      <span className="text-neutral-400">Chờ xử lý</span>
                    )}
                    {item.status === 'analyzing' && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        AI đang phân tích chủ thể...
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="text-indigo-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang tách nền ({item.progress}%)...
                      </span>
                    )}
                    {item.status === 'done' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        Tách nền thành công (PNG)
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {item.errorMessage || 'Lỗi xử lý'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {item.status === 'idle' || item.status === 'error' ? (
                  <button
                    onClick={() => onProcessSingle(item.id)}
                    disabled={isProcessingBatch}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700"
                  >
                    <Play className="w-3 h-3" />
                    <span>Tách nền</span>
                  </button>
                ) : null}

                {item.status === 'done' && (
                  <>
                    <button
                      onClick={() => onEditItem(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 rounded-lg transition-colors border border-neutral-700"
                      title="Mở trong trình chỉnh sửa chi tiết"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-400" />
                      <span>Sửa chi tiết</span>
                    </button>

                    <button
                      onClick={() => onDownloadItem(item)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
                      title="Tải ảnh PNG về máy"
                    >
                      <Download className="w-3 h-3" />
                      <span>Tải PNG</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isProcessingBatch && (item.status === 'processing' || item.status === 'analyzing')}
                  className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-neutral-800 disabled:opacity-30"
                  title="Xóa ảnh này khỏi hàng đợi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
