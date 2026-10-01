import React from 'react';
import { Layers, Wand2, Download, Upload, Images } from 'lucide-react';

interface HeaderProps {
  activeTab: 'editor' | 'batch';
  setActiveTab: (tab: 'editor' | 'batch') => void;
  batchCount: number;
  onUploadClick: () => void;
  onDownloadAllZip?: () => void;
  canDownloadZip?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  batchCount,
  onUploadClick,
  onDownloadAllZip,
  canDownloadZip = false,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            PhôngAI
            <span className="text-xs font-normal text-neutral-400">· Tách Nền Studio</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented Mode Controls */}
        <nav className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === 'editor'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Trình Chỉnh Sửa</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === 'batch'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>Xử Lý Hàng Loạt</span>
            {batchCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono bg-indigo-500/20 text-indigo-400 rounded">
                {batchCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'batch' && canDownloadZip && onDownloadAllZip && (
            <button
              onClick={onDownloadAllZip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tải Tất Cả (.ZIP)</span>
            </button>
          )}

          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm shadow-indigo-600/30 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Thêm Ảnh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
