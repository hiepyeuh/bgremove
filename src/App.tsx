import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import {
  ImageItem,
  BackgroundConfig,
  BrushConfig,
  SubjectCategory,
} from './types';
import { SAMPLE_IMAGES, PRESET_BACKGROUNDS } from './utils/constants';
import {
  loadImage,
  analyzeSubjectWithGemini,
  removeBackgroundHighRes,
  renderCompositedCanvas,
  canvasToBlob,
} from './utils/aiSegmentation';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SplitComparisonSlider } from './components/SplitComparisonSlider';
import { CanvasEditor } from './components/CanvasEditor';
import { QuickEditToolbar } from './components/QuickEditToolbar';
import { BatchProcessor } from './components/BatchProcessor';
import { AIInfoBadge } from './components/AIInfoBadge';
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  Images,
} from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'batch'>('editor');
  const [viewMode, setViewMode] = useState<'split' | 'canvas'>('split');
  const [activeToolTab, setActiveToolTab] = useState<'bg' | 'brush'>('bg');

  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    type: 'transparent',
    color: '#FFFFFF',
    gradient: 'studio',
    blurAmount: 15,
  });

  const [globalBatchBgConfig, setGlobalBatchBgConfig] = useState<BackgroundConfig>({
    type: 'transparent',
    color: '#FFFFFF',
    gradient: 'studio',
    blurAmount: 15,
  });

  const [brushConfig, setBrushConfig] = useState<BrushConfig>({
    mode: 'erase',
    size: 25,
    hardness: 0.8,
    opacity: 1,
  });

  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Preloaded image elements cache
  const loadedImagesCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const presetBgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preload preset background images
  useEffect(() => {
    PRESET_BACKGROUNDS.forEach(async (bg) => {
      try {
        const img = await loadImage(bg.url);
        presetBgCache.current.set(bg.url, img);
      } catch (e) {
        console.warn('Could not preload background:', bg.url, e);
      }
    });
  }, []);

  // Current active image item
  const activeItem = items.find((i) => i.id === selectedId) || null;

  // Process a single image with AI background removal
  const processImage = useCallback(
    async (item: ImageItem, categoryOverride?: SubjectCategory) => {
      try {
        // Set analyzing state
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'analyzing', progress: 5, category: categoryOverride || i.category }
              : i
          )
        );

        // Load image element
        let img = loadedImagesCache.current.get(item.originalUrl);
        if (!img) {
          img = await loadImage(item.originalUrl);
          loadedImagesCache.current.set(item.originalUrl, img);
        }

        // Call Gemini for subject & bounding analysis
        const analysis = await analyzeSubjectWithGemini(
          img,
          categoryOverride || item.category
        );

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'processing', progress: 20, aiAnalysis: analysis }
              : i
          )
        );

        // Run full-resolution AI alpha matting engine
        const { rawMask, resultUrl, width, height } = await removeBackgroundHighRes(
          img,
          analysis,
          (percent) => {
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, progress: percent } : i
              )
            );
          }
        );

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'done',
                  progress: 100,
                  rawMask,
                  resultUrl,
                  originalWidth: width,
                  originalHeight: height,
                }
              : i
          )
        );
      } catch (err: any) {
        console.error('Lỗi tách nền:', err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'error',
                  progress: 0,
                  errorMessage: err?.message || 'Lỗi xử lý hình ảnh',
                }
              : i
          )
        );
      }
    },
    []
  );

  // Handle file uploads (single or multiple)
  const handleFilesSelected = async (files: File[]) => {
    const newItems: ImageItem[] = [];

    for (const file of files) {
      const url = URL.createObjectURL(file);
      const id = 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

      // Read dimensions quickly
      const img = await loadImage(url);
      loadedImagesCache.current.set(url, img);

      newItems.push({
        id,
        file,
        name: file.name,
        originalUrl: url,
        originalWidth: img.naturalWidth || img.width,
        originalHeight: img.naturalHeight || img.height,
        fileSize: file.size,
        mimeType: file.type || 'image/jpeg',
        status: 'idle',
        progress: 0,
        category: 'auto',
      });
    }

    setItems((prev) => [...prev, ...newItems]);

    // If only one file uploaded or first files uploaded, set as active and auto process
    if (newItems.length === 1 && items.length === 0) {
      setSelectedId(newItems[0].id);
      setActiveTab('editor');
      processImage(newItems[0]);
    } else if (newItems.length > 1) {
      // Multiple files uploaded -> Switch to batch tab
      setSelectedId(newItems[0].id);
      setActiveTab('batch');
    } else if (!selectedId && newItems.length > 0) {
      setSelectedId(newItems[0].id);
    }
  };

  // Handle sample image click
  const handleSelectSample = async (sampleId: string) => {
    const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId);
    if (!sample) return;

    const img = await loadImage(sample.url);
    loadedImagesCache.current.set(sample.url, img);

    const newItem: ImageItem = {
      id: 'sample-' + Date.now(),
      name: sample.name,
      originalUrl: sample.url,
      originalWidth: img.naturalWidth || img.width,
      originalHeight: img.naturalHeight || img.height,
      fileSize: 450 * 1024,
      mimeType: 'image/jpeg',
      status: 'idle',
      progress: 0,
      category: sample.category,
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setActiveTab('editor');
    processImage(newItem, sample.category);
  };

  // Process all items in queue (Batch)
  const handleProcessAllBatch = async () => {
    const pendingItems = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (pendingItems.length === 0) return;

    setIsProcessingBatch(true);
    setBatchProgress(0);

    let completed = 0;
    for (const item of pendingItems) {
      await processImage(item);
      completed++;
      setBatchProgress((completed / pendingItems.length) * 100);
    }

    setIsProcessingBatch(false);
  };

  // Download a single item
  const handleDownloadItem = async (item: ImageItem, customBg?: BackgroundConfig) => {
    if (!item.rawMask) return;

    const img = loadedImagesCache.current.get(item.originalUrl) || (await loadImage(item.originalUrl));
    const width = item.originalWidth;
    const height = item.originalHeight;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;

    const bgToUse = customBg || backgroundConfig;
    const cachedBg = bgToUse.imageUrl ? presetBgCache.current.get(bgToUse.imageUrl) : null;

    await renderCompositedCanvas(img, item.rawMask, offCanvas, bgToUse, cachedBg);

    const blob = await canvasToBlob(offCanvas, 'image/png');
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    const cleanBaseName = item.name.replace(/\.[^/.]+$/, '');
    a.download = `${cleanBaseName}_tach_nen.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const doneItems = items.filter((i) => i.status === 'done' && i.rawMask);
    if (doneItems.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder('phongai_anh_tach_nen');

    for (let idx = 0; idx < doneItems.length; idx++) {
      const item = doneItems[idx];
      const img = loadedImagesCache.current.get(item.originalUrl) || (await loadImage(item.originalUrl));

      const offCanvas = document.createElement('canvas');
      offCanvas.width = item.originalWidth;
      offCanvas.height = item.originalHeight;

      const cachedBg = globalBatchBgConfig.imageUrl
        ? presetBgCache.current.get(globalBatchBgConfig.imageUrl)
        : null;

      await renderCompositedCanvas(
        img,
        item.rawMask!,
        offCanvas,
        globalBatchBgConfig,
        cachedBg
      );

      const blob = await canvasToBlob(offCanvas, 'image/png');
      const cleanBaseName = item.name.replace(/\.[^/.]+$/, '');
      folder?.file(`${cleanBaseName}_tach_nen.png`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);

    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = `phongai_tach_nen_hang_loat_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(zipUrl);
  };

  // Copy current transparent cutout to clipboard
  const handleCopyToClipboard = async () => {
    if (!activeItem || !activeItem.rawMask) return;
    try {
      const img = loadedImagesCache.current.get(activeItem.originalUrl) || (await loadImage(activeItem.originalUrl));
      const offCanvas = document.createElement('canvas');
      offCanvas.width = activeItem.originalWidth;
      offCanvas.height = activeItem.originalHeight;

      // Copy pure transparent cutout
      await renderCompositedCanvas(img, activeItem.rawMask, offCanvas, {
        type: 'transparent',
        color: '#ffffff',
        gradient: 'studio',
        blurAmount: 0,
      });

      const blob = await canvasToBlob(offCanvas, 'image/png');
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  // Mask updated from brush edits in CanvasEditor
  const handleMaskUpdated = (newMask: Uint8ClampedArray) => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== selectedId) return i;
        const copy = new Uint8ClampedArray(newMask.length);
        copy.set(newMask);
        return {
          ...i,
          rawMask: copy,
        };
      })
    );
  };

  const completedCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Hidden file input for global upload button in header */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp, image/avif"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(Array.from(e.target.files));
          }
        }}
        className="hidden"
      />

      {/* Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        batchCount={items.length}
        onUploadClick={() => fileInputRef.current?.click()}
        onDownloadAllZip={handleDownloadAllZip}
        canDownloadZip={completedCount > 0}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 flex flex-col">
        {/* If no images uploaded yet, show UploadZone with sample demos */}
        {items.length === 0 ? (
          <UploadZone
            onFilesSelected={handleFilesSelected}
            onSelectSample={handleSelectSample}
          />
        ) : activeTab === 'batch' ? (
          /* Batch Processing Mode View */
          <BatchProcessor
            items={items}
            onProcessAll={handleProcessAllBatch}
            onProcessSingle={(id) => {
              const item = items.find((i) => i.id === id);
              if (item) processImage(item);
            }}
            onEditItem={(id) => {
              setSelectedId(id);
              setActiveTab('editor');
            }}
            onRemoveItem={(id) => {
              setItems((prev) => prev.filter((i) => i.id !== id));
              if (selectedId === id) {
                const remaining = items.filter((i) => i.id !== id);
                setSelectedId(remaining.length > 0 ? remaining[0].id : null);
              }
            }}
            onDownloadItem={(item) => handleDownloadItem(item, globalBatchBgConfig)}
            onDownloadAllZip={handleDownloadAllZip}
            onClearAll={() => {
              setItems([]);
              setSelectedId(null);
            }}
            isProcessingBatch={isProcessingBatch}
            batchProgress={batchProgress}
            globalBgConfig={globalBatchBgConfig}
            setGlobalBgConfig={setGlobalBatchBgConfig}
          />
        ) : (
          /* Single Editor Mode View */
          <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-4">
            {/* Top Editor Breadcrumb / Sub-bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('batch')}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Danh sách hàng loạt ({items.length})</span>
                </button>
                <span aria-hidden="true" className="text-neutral-600">/</span>
                <span className="font-semibold text-white truncate max-w-xs">
                  {activeItem?.name}
                </span>
              </div>

              {/* Quick Thumb Carousel for switching between images */}
              {items.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                  {items.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => {
                        setSelectedId(it.id);
                        if (it.status === 'idle') {
                          processImage(it);
                        }
                      }}
                      className={`relative w-9 h-9 rounded-lg overflow-hidden border transition-all shrink-0 ${
                        selectedId === it.id
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                          : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                      title={it.name}
                    >
                      <img
                        src={it.resultUrl || it.originalUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Info & Resolution Badge */}
            {activeItem && (
              <AIInfoBadge
                analysis={activeItem.aiAnalysis}
                category={activeItem.category}
                width={activeItem.originalWidth}
                height={activeItem.originalHeight}
              />
            )}

            {/* Editor Canvas or Slider */}
            {activeItem && (
              <div className="relative w-full rounded-2xl bg-neutral-900 border border-neutral-800 p-3 sm:p-5 shadow-2xl">
                {/* Processing Overlay if currently running */}
                {(activeItem.status === 'analyzing' || activeItem.status === 'processing') && (
                  <div className="absolute inset-0 z-30 bg-neutral-950/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="text-base font-bold text-white mb-1">
                      {activeItem.status === 'analyzing'
                        ? 'AI đang phân tích nhận diện chủ thể...'
                        : 'Đang bóc tách nền độ phân giải cao...'}
                    </div>
                    <p className="text-xs text-neutral-400 max-w-sm mb-4">
                      Giữ nguyên 100% chi tiết tóc, sợi vải và viền mép vật thể ở kích thước gốc.
                    </p>

                    {/* Progress Bar */}
                    <div className="w-64 max-w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                        style={{ width: `${activeItem.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums text-indigo-400 mt-2">
                      {activeItem.progress}%
                    </span>
                  </div>
                )}

                {/* If Done, show Split Slider or Interactive Canvas */}
                {activeItem.status === 'done' && activeItem.rawMask && (
                  <>
                    {viewMode === 'split' ? (
                      <SplitComparisonSlider
                        originalSrc={activeItem.originalUrl}
                        resultDataUrl={activeItem.resultUrl}
                        width={activeItem.originalWidth}
                        height={activeItem.originalHeight}
                      />
                    ) : (
                      <CanvasEditor
                        originalImg={loadedImagesCache.current.get(activeItem.originalUrl)!}
                        rawMask={activeItem.rawMask}
                        onMaskUpdated={handleMaskUpdated}
                        backgroundConfig={backgroundConfig}
                        brushConfig={brushConfig}
                        brushActive={activeToolTab === 'brush'}
                        presetBgImages={presetBgCache.current}
                      />
                    )}
                  </>
                )}

                {/* If Idle (not processed yet) */}
                {activeItem.status === 'idle' && (
                  <div className="py-24 text-center">
                    <button
                      onClick={() => processImage(activeItem)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Bắt đầu xóa nền bằng AI</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Edit Controls Toolbar */}
            {activeItem && activeItem.status === 'done' && (
              <QuickEditToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                backgroundConfig={backgroundConfig}
                setBackgroundConfig={setBackgroundConfig}
                brushConfig={brushConfig}
                setBrushConfig={setBrushConfig}
                activeToolTab={activeToolTab}
                setActiveToolTab={setActiveToolTab}
                subjectCategory={activeItem.category}
                onCategoryChange={(cat) => {
                  setItems((prev) =>
                    prev.map((i) => (i.id === activeItem.id ? { ...i, category: cat } : i))
                  );
                  processImage(activeItem, cat);
                }}
                onReProcess={() => processImage(activeItem, activeItem.category)}
                onDownloadPNG={() => handleDownloadItem(activeItem, backgroundConfig)}
                onCopyToClipboard={handleCopyToClipboard}
                originalWidth={activeItem.originalWidth}
                originalHeight={activeItem.originalHeight}
                isProcessing={items.some((i) => i.id === activeItem.id && (i.status === 'processing' || i.status === 'analyzing'))}
              />
            )}
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>PhôngAI · Công cụ tách nền ảnh thông minh chất lượng cao</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Định dạng PNG 32-bit</span>
            <span aria-hidden="true">·</span>
            <span>Bảo mật thiết bị</span>
            <span aria-hidden="true">·</span>
            <span>Hỗ trợ xuất ZIP hàng loạt</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
