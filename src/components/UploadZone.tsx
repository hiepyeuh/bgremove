import React, { useRef, useState } from 'react';
import { UploadCloud, Sparkles, Image as ImageIcon, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { SAMPLE_IMAGES } from '../utils/constants';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onSelectSample: (sampleId: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, onSelectSample }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Hero Intro */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 max-w-2xl mx-auto text-balance">
          Tách nền ảnh tự động bằng AI, giữ trọn độ nét cao
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto mb-6">
          Xóa phông chuẩn xác từng sợi tóc, lưu ảnh PNG trong suốt độ phân giải gốc. Hỗ trợ chỉnh sửa nhanh và xử lý hàng loạt tiện lợi.
        </p>

        {/* Quiet metadata indicators */}
        <div className="flex items-center justify-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Xử lý tức thì
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Độ phân giải gốc 100%
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Xuất PNG trong suốt
          </span>
        </div>
      </div>

      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/jpg, image/webp, image/avif"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-neutral-800 group-hover:bg-indigo-600/20 text-neutral-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
          <UploadCloud className="w-8 h-8 transition-transform group-hover:scale-110" />
        </div>

        <div className="text-base sm:text-lg font-semibold text-white mb-1.5">
          Kéo thả ảnh vào đây hoặc bấm để chọn tệp
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 mb-4">
          Hỗ trợ chọn cùng lúc nhiều ảnh để xử lý hàng loạt · PNG, JPG, WebP (Lên tới 8K)
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/25"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Chọn ảnh từ thiết bị</span>
        </button>
      </div>

      {/* Sample Images Section */}
      <div className="mt-8 pt-6 border-t border-neutral-800">
        <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3 text-center sm:text-left">
          Hoặc thử ngay với ảnh mẫu có sẵn:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="group flex items-center gap-3 p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all text-left"
            >
              <img
                src={sample.url}
                alt={sample.title}
                referrerPolicy="no-referrer"
                className="w-14 h-14 object-cover rounded-lg border border-neutral-750 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate flex items-center justify-between">
                  <span>{sample.title}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {sample.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
