import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable large payload size for high-res images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Subject and Contour Analysis Endpoint
app.post('/api/ai/analyze-subject', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', subjectHint = 'auto' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh (imageBase64)' });
    }

    if (!ai) {
      // Graceful fallback if API key is not yet set
      return res.json({
        fallback: true,
        subjectName: 'Chủ thể chính',
        category: subjectHint === 'auto' ? 'general' : subjectHint,
        boundingBox: [100, 100, 900, 900],
        backgroundType: 'complex',
        suggestedEdgeFeather: 2,
        colorHints: { foregroundDominant: '#333333', backgroundDominant: '#eeeeee' },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const promptText = `Bạn là chuyên gia phân tích hình ảnh AI cho công cụ tách nền ảnh (Background Remover).
Hãy phân tích hình ảnh đính kèm và xác định chủ thể chính cần tách nền (người, sản phẩm, thú cưng, xe cộ, đồ hoạ, vật thể...).
Loại gợi ý người dùng chọn: ${subjectHint}.

Hãy trả về JSON với cấu trúc:
- subjectName: tên ngắn gọn mô tả chủ thể chính bằng tiếng Việt (ví dụ: "Người phụ nữ mỉm cười", "Đôi giày thể thao", "Chai nước hoa", "Chú chó con", "Logo thương hiệu")
- category: phân loại chính trong các giá trị ["portrait", "product", "animal", "graphic", "vehicle", "other"]
- boundingBox: toạ độ hộp bao quanh chủ thể chính dạng [ymin, xmin, ymax, xmax] theo thang điểm từ 0 đến 1000 (chuẩn hoá)
- backgroundType: kiểu hậu cảnh ["solid", "studio", "outdoor", "indoor", "complex", "gradient"]
- suggestedEdgeFeather: mức độ làm mềm biên cọ khuyên dùng (số nguyên từ 1 đến 8)
- subjectForegroundSeeds: danh sách 3 đến 8 toạ độ [y, x] (thang điểm 0-1000) chắc chắn nằm bên trong chủ thể
- backgroundSeeds: danh sách 3 đến 8 toạ độ [y, x] (thang điểm 0-1000) chắc chắn nằm ở hậu cảnh / viền ngoài
- foregroundDominantColor: mã màu hex đại diện cho chủ thể (ví dụ: "#3b4a59")
- backgroundDominantColor: mã màu hex đại diện cho nền (ví dụ: "#e0e5ea")
- clarityScore: điểm độ rõ ràng của viền từ 1 đến 10`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectName: { type: Type.STRING },
            category: { type: Type.STRING },
            boundingBox: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
            },
            backgroundType: { type: Type.STRING },
            suggestedEdgeFeather: { type: Type.INTEGER },
            subjectForegroundSeeds: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
              },
            },
            backgroundSeeds: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
              },
            },
            foregroundDominantColor: { type: Type.STRING },
            backgroundDominantColor: { type: Type.STRING },
            clarityScore: { type: Type.INTEGER },
          },
          required: ['subjectName', 'category', 'boundingBox', 'backgroundType'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      fallback: false,
      ...parsed,
    });
  } catch (error: any) {
    console.error('Lỗi khi phân tích chủ thể AI:', error);
    return res.json({
      fallback: true,
      error: error?.message || 'Không thể gọi AI, sử dụng thuật toán nội bộ.',
      subjectName: 'Chủ thể chính',
      category: 'general',
      boundingBox: [50, 50, 950, 950],
      backgroundType: 'complex',
      suggestedEdgeFeather: 2,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
