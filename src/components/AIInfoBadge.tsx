import React from 'react';
import { AISubjectAnalysis, SubjectCategory } from '../types';
import { Sparkles, Eye, CheckCircle2 } from 'lucide-react';

interface AIInfoBadgeProps {
  analysis?: AISubjectAnalysis;
  category: SubjectCategory;
  width: number;
  height: number;
}

export const AIInfoBadge: React.FC<AIInfoBadgeProps> = ({
  analysis,
  width,
  height,
}) => {
  if (!analysis) return null;

  const categoryLabels: Record<string, string> = {
    portrait: 'Chân dung & Người',
    product: 'Sản phẩm Thương mại',
    animal: 'Động vật / Thú cưng',
    graphic: 'Đồ hoạ & Biểu trưng',
    vehicle: 'Phương tiện',
    general: 'Chủ thể tự nhiên',
    other: 'Chủ thể tự nhiên',
  };

  const detectedCategory = analysis.category || 'general';
  const label = categoryLabels[detectedCategory] || 'Chủ thể tự nhiên';

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 py-1 px-1">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="font-semibold text-white">
          {analysis.subjectName || 'Chủ thể chính'}
        </span>
        <span aria-hidden="true" className="text-neutral-600">·</span>
        <span>{label}</span>
      </div>

      <div className="flex items-center gap-3 text-neutral-400">
        <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
          <Eye className="w-3.5 h-3.5 text-neutral-500" />
          <span>{width} × {height} px</span>
        </div>
        <span aria-hidden="true" className="text-neutral-600">·</span>
        <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Độ nét gốc 100%</span>
        </div>
      </div>
    </div>
  );
};
