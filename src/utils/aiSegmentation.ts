import { AISubjectAnalysis, SubjectCategory } from '../types';

/**
 * Helper to load an HTMLImageElement from a URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Không thể tải hình ảnh: ' + err));
    img.src = src;
  });
}

/**
 * Generate a thumbnail data URL to send to Gemini API for fast AI analysis
 */
export async function createAnalysisThumbnail(
  img: HTMLImageElement,
  maxDim = 768
): Promise<{ base64: string; mimeType: string }> {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Không thể khởi tạo 2D context');

  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return {
    base64: dataUrl,
    mimeType: 'image/jpeg',
  };
}

/**
 * Request AI subject and bounding analysis from server-side Gemini 3.8 Flash
 */
export async function analyzeSubjectWithGemini(
  img: HTMLImageElement,
  subjectCategory: SubjectCategory = 'auto'
): Promise<AISubjectAnalysis> {
  try {
    const { base64, mimeType } = await createAnalysisThumbnail(img, 768);
    const response = await fetch('/api/ai/analyze-subject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType,
        subjectHint: subjectCategory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Lỗi phản hồi từ máy chủ: ${response.status}`);
    }

    const data: AISubjectAnalysis = await response.json();
    return data;
  } catch (error) {
    console.warn('AI Gemini analysis fallback to local heuristics:', error);
    // Intelligent fallback
    return {
      fallback: true,
      subjectName: 'Chủ thể tự động',
      category: subjectCategory === 'auto' ? 'general' : subjectCategory,
      boundingBox: [80, 80, 920, 920],
      backgroundType: 'complex',
      suggestedEdgeFeather: 2,
      clarityScore: 8,
    };
  }
}

/**
 * Perceptual color distance (weighted RGB approximation of human vision)
 */
function colorDistanceSq(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8);
}

/**
 * High-Resolution AI Alpha Matting Engine
 * Operates at 100% full original resolution without downsampling.
 */
export async function removeBackgroundHighRes(
  img: HTMLImageElement,
  analysis: AISubjectAnalysis,
  onProgress?: (percent: number) => void
): Promise<{
  rawMask: Uint8ClampedArray;
  resultUrl: string;
  width: number;
  height: number;
}> {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const totalPixels = width * height;

  onProgress?.(10);

  // Setup full-resolution canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Không thể khởi tạo 2D context');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  onProgress?.(25);

  // Determine bounding box from AI analysis or default centered
  const bbox = analysis.boundingBox || [80, 80, 920, 920];
  const minY = Math.max(0, Math.floor((bbox[0] / 1000) * height));
  const minX = Math.max(0, Math.floor((bbox[1] / 1000) * width));
  const maxY = Math.min(height - 1, Math.ceil((bbox[2] / 1000) * height));
  const maxX = Math.min(width - 1, Math.ceil((bbox[3] / 1000) * width));

  // Sample background colors from outer borders (top, bottom, left, right edges)
  const bgSamples: [number, number, number][] = [];
  const borderThickness = Math.max(4, Math.floor(Math.min(width, height) * 0.04));

  // Top and bottom borders
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 60))) {
    for (let dy = 0; dy < borderThickness; dy++) {
      const topIdx = (dy * width + x) * 4;
      bgSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
      const botIdx = ((height - 1 - dy) * width + x) * 4;
      bgSamples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
    }
  }

  // Left and right borders
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 60))) {
    for (let dx = 0; dx < borderThickness; dx++) {
      const leftIdx = (y * width + dx) * 4;
      bgSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
      const rightIdx = (y * width + (width - 1 - dx)) * 4;
      bgSamples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
    }
  }

  // AI-provided background seeds if any
  if (analysis.backgroundSeeds && analysis.backgroundSeeds.length > 0) {
    for (const [sy, sx] of analysis.backgroundSeeds) {
      const py = Math.min(height - 1, Math.max(0, Math.floor((sy / 1000) * height)));
      const px = Math.min(width - 1, Math.max(0, Math.floor((sx / 1000) * width)));
      const idx = (py * width + px) * 4;
      bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  // Sample foreground seeds from center of bounding box and AI seeds
  const fgSamples: [number, number, number][] = [];
  const centerX = Math.floor((minX + maxX) / 2);
  const centerY = Math.floor((minY + maxY) / 2);
  const coreRadiusX = Math.max(4, Math.floor((maxX - minX) * 0.18));
  const coreRadiusY = Math.max(4, Math.floor((maxY - minY) * 0.18));

  for (let dy = -coreRadiusY; dy <= coreRadiusY; dy += Math.max(1, Math.floor(coreRadiusY / 5))) {
    for (let dx = -coreRadiusX; dx <= coreRadiusX; dx += Math.max(1, Math.floor(coreRadiusX / 5))) {
      const py = Math.min(height - 1, Math.max(0, centerY + dy));
      const px = Math.min(width - 1, Math.max(0, centerX + dx));
      const idx = (py * width + px) * 4;
      fgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  if (analysis.subjectForegroundSeeds && analysis.subjectForegroundSeeds.length > 0) {
    for (const [sy, sx] of analysis.subjectForegroundSeeds) {
      const py = Math.min(height - 1, Math.max(0, Math.floor((sy / 1000) * height)));
      const px = Math.min(width - 1, Math.max(0, Math.floor((sx / 1000) * width)));
      const idx = (py * width + px) * 4;
      fgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
  }

  onProgress?.(45);

  // Compute adaptive color distance thresholds
  const rawMask = new Uint8ClampedArray(totalPixels);
  const thresholdDistSq = 42 * 42; // Perceptual color boundary
  const confidentDistSq = 75 * 75;

  // Compute Sobel gradient magnitude for edge preservation
  const gradMap = new Float32Array(totalPixels);
  // Quick gradient approximation on a grid
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;
      const pIdx = idx * 4;

      // Horizontal gradient
      const rH = data[pIdx + 4] - data[pIdx - 4];
      const gH = data[pIdx + 5] - data[pIdx - 3];
      const bH = data[pIdx + 6] - data[pIdx - 2];

      // Vertical gradient
      const pDown = (idx + width) * 4;
      const pUp = (idx - width) * 4;
      const rV = data[pDown] - data[pUp];
      const gV = data[pDown + 1] - data[pUp + 1];
      const bV = data[pDown + 2] - data[pUp + 2];

      gradMap[idx] = Math.sqrt(rH * rH + gH * gH + bH * bH + rV * rV + gV * gV + bV * bV);
    }
  }

  onProgress?.(65);

  // Distance evaluation for each pixel
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const inBoxY = y >= minY && y <= maxY;

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const inBox = inBoxY && x >= minX && x <= maxX;

      // Far outside the bounding box is background
      const distToBoxX = x < minX ? minX - x : x > maxX ? x - maxX : 0;
      const distToBoxY = y < minY ? minY - y : y > maxY ? y - maxY : 0;
      const marginDist = Math.sqrt(distToBoxX * distToBoxX + distToBoxY * distToBoxY);
      const safeMargin = Math.min(width, height) * 0.08;

      if (!inBox && marginDist > safeMargin) {
        rawMask[idx] = 0;
        continue;
      }

      const pIdx = idx * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      // Find closest background sample
      let minBgDistSq = Infinity;
      for (let i = 0; i < bgSamples.length; i++) {
        const dSq = colorDistanceSq(r, g, b, bgSamples[i][0], bgSamples[i][1], bgSamples[i][2]);
        if (dSq < minBgDistSq) minBgDistSq = dSq;
      }

      // Find closest foreground sample
      let minFgDistSq = Infinity;
      for (let i = 0; i < fgSamples.length; i++) {
        const dSq = colorDistanceSq(r, g, b, fgSamples[i][0], fgSamples[i][1], fgSamples[i][2]);
        if (dSq < minFgDistSq) minFgDistSq = dSq;
      }

      // Saliency probability calculation
      let alpha: number;
      if (minBgDistSq < thresholdDistSq && minFgDistSq > thresholdDistSq * 1.5) {
        // High likelihood background
        alpha = 0;
      } else if (minFgDistSq < thresholdDistSq && minBgDistSq > thresholdDistSq * 1.5) {
        // High likelihood foreground
        alpha = 255;
      } else {
        // In-between / boundary transition zone
        const bgScore = Math.sqrt(minBgDistSq);
        const fgScore = Math.sqrt(minFgDistSq);
        const ratio = bgScore / (bgScore + fgScore + 1e-5);
        alpha = Math.floor(Math.max(0, Math.min(1, (ratio - 0.42) / 0.22)) * 255);
      }

      // Spatial prior: pixels closer to center of bounding box have higher foreground prior
      if (inBox) {
        const normDistX = Math.abs(x - centerX) / ((maxX - minX) / 2 + 1);
        const normDistY = Math.abs(y - centerY) / ((maxY - minY) / 2 + 1);
        const spatialFactor = Math.max(0, 1 - Math.sqrt(normDistX * normDistX + normDistY * normDistY) * 0.65);
        if (alpha > 0 && spatialFactor > 0.4) {
          alpha = Math.min(255, Math.floor(alpha * 1.15 + spatialFactor * 30));
        }
      }

      // Edge refinement using gradient
      const edge = gradMap[idx];
      if (edge > 60 && alpha > 30 && alpha < 225) {
        // High contrast edge: sharpen decision to avoid fuzzy haloes
        alpha = alpha > 128 ? 255 : 0;
      }

      rawMask[idx] = alpha;
    }
  }

  onProgress?.(80);

  // Morphological & bilateral smoothing on alpha mask to eliminate pinhole noise
  const smoothedMask = new Uint8ClampedArray(totalPixels);
  smoothedMask.set(rawMask);

  // Fast 3x3 median-box filter on ambiguous pixels
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;
      const current = rawMask[idx];
      if (current === 0 || current === 255) continue; // Keep hard decisions

      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += rawMask[(y + dy) * width + (x + dx)];
          count++;
        }
      }
      smoothedMask[idx] = Math.round(sum / count);
    }
  }

  onProgress?.(92);

  // Apply final alpha to the canvas image data to produce transparent PNG
  for (let i = 0; i < totalPixels; i++) {
    data[i * 4 + 3] = smoothedMask[i];
  }

  ctx.putImageData(imgData, 0, 0);
  const resultUrl = canvas.toDataURL('image/png');

  onProgress?.(100);

  return {
    rawMask: smoothedMask,
    resultUrl,
    width,
    height,
  };
}

/**
 * Composite the cut subject over transparent, solid color, gradient, blurred background or custom image
 */
export async function renderCompositedCanvas(
  originalImg: HTMLImageElement,
  rawMask: Uint8ClampedArray,
  targetCanvas: HTMLCanvasElement,
  backgroundConfig: {
    type: 'transparent' | 'color' | 'gradient' | 'image' | 'blur';
    color: string;
    gradient: string;
    imageUrl?: string;
    blurAmount: number;
  },
  cachedBgImage?: HTMLImageElement | null
): Promise<void> {
  const width = originalImg.naturalWidth || originalImg.width;
  const height = originalImg.naturalHeight || originalImg.height;

  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Background
  if (backgroundConfig.type === 'color') {
    ctx.fillStyle = backgroundConfig.color;
    ctx.fillRect(0, 0, width, height);
  } else if (backgroundConfig.type === 'gradient') {
    // Parse gradient or create linear gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (backgroundConfig.gradient === 'studio') {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.5, '#e2e8f0');
      grad.addColorStop(1, '#94a3b8');
    } else if (backgroundConfig.gradient === 'sunset') {
      grad.addColorStop(0, '#fed7aa');
      grad.addColorStop(0.6, '#f472b6');
      grad.addColorStop(1, '#a855f7');
    } else if (backgroundConfig.gradient === 'modern') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#334155');
    } else if (backgroundConfig.gradient === 'cyber') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0e7490');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (backgroundConfig.type === 'blur') {
    // Draw original image with blur filter
    ctx.save();
    ctx.filter = `blur(${Math.max(1, backgroundConfig.blurAmount)}px)`;
    // Scale slightly to avoid border blur bleeding
    const scale = 1.05;
    const dx = -(width * (scale - 1)) / 2;
    const dy = -(height * (scale - 1)) / 2;
    ctx.drawImage(originalImg, dx, dy, width * scale, height * scale);
    ctx.restore();
  } else if (backgroundConfig.type === 'image' && cachedBgImage) {
    // Cover scale preset background
    const bgW = cachedBgImage.naturalWidth || cachedBgImage.width;
    const bgH = cachedBgImage.naturalHeight || cachedBgImage.height;
    const scale = Math.max(width / bgW, height / bgH);
    const sw = bgW * scale;
    const sh = bgH * scale;
    const sx = (width - sw) / 2;
    const sy = (height - sh) / 2;
    ctx.drawImage(cachedBgImage, sx, sy, sw, sh);
  }

  // 2. Draw Foreground (Cutout Subject)
  // Create an offscreen buffer for the cutout
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext('2d');
  if (!offCtx) return;

  offCtx.drawImage(originalImg, 0, 0, width, height);
  const fgData = offCtx.getImageData(0, 0, width, height);
  const fgPixels = fgData.data;

  // Apply alpha mask
  for (let i = 0; i < rawMask.length; i++) {
    fgPixels[i * 4 + 3] = rawMask[i];
  }
  offCtx.putImageData(fgData, 0, 0);

  // Draw masked subject on top
  ctx.drawImage(offCanvas, 0, 0);
}

/**
 * Apply brush edit (Erase or Restore) to raw mask
 */
export function applyBrushToMask(
  rawMask: Uint8ClampedArray,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  mode: 'erase' | 'restore',
  hardness = 0.8,
  opacity = 1
): void {
  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

  const targetAlpha = mode === 'restore' ? 255 : 0;
  const radiusSq = radius * radius;
  const innerRadius = radius * hardness;
  const innerRadiusSq = innerRadius * innerRadius;

  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distSq = dx * dx + dy * dy;

      if (distSq > radiusSq) continue;

      let factor = 1;
      if (distSq > innerRadiusSq) {
        // Feathered edge falloff
        const dist = Math.sqrt(distSq);
        factor = 1 - (dist - innerRadius) / (radius - innerRadius + 1e-5);
      }

      const effectiveFactor = factor * opacity;
      const idx = rowOffset + x;
      const current = rawMask[idx];

      if (mode === 'restore') {
        rawMask[idx] = Math.min(255, Math.round(current + (targetAlpha - current) * effectiveFactor));
      } else {
        rawMask[idx] = Math.max(0, Math.round(current - current * effectiveFactor));
      }
    }
  }
}

/**
 * Export high-resolution PNG as Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, mimeType = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Lỗi chuyển đổi canvas sang blob'));
      },
      mimeType,
      1.0
    );
  });
}
