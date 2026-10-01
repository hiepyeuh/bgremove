import samplePortrait from '../assets/images/sample_portrait_demo_1790817274381.jpg';
import sampleProduct from '../assets/images/sample_product_demo_1790817286479.jpg';
import samplePet from '../assets/images/sample_pet_demo_1790817298264.jpg';
import bgPodium from '../assets/images/bg_studio_podium_1790817309633.jpg';
import bgOffice from '../assets/images/bg_modern_office_1790817320614.jpg';
import { PresetBackground, SubjectCategory } from '../types';

export const SAMPLE_IMAGES = [
  {
    id: 'sample-portrait',
    name: 'chan_dung_nu.jpg',
    title: 'Chân dung & Tóc',
    category: 'portrait' as SubjectCategory,
    url: samplePortrait,
    description: 'Tách chi tiết tóc uốn lọn và đường nét khuôn mặt',
  },
  {
    id: 'sample-product',
    name: 'giay_the_thao_sneaker.jpg',
    title: 'Sản phẩm Thương mại',
    category: 'product' as SubjectCategory,
    url: sampleProduct,
    description: 'Tách đế giày và góc cạnh sản phẩm cho Shopee/Amazon',
  },
  {
    id: 'sample-pet',
    name: 'chu_cho_long_vang.jpg',
    title: 'Thú cưng & Lông tơ',
    category: 'animal' as SubjectCategory,
    url: samplePet,
    description: 'Xử lý viền lông động vật phức tạp',
  },
];

export const PRESET_BACKGROUNDS: PresetBackground[] = [
  {
    id: 'bg-podium',
    title: 'Bục đá Studio',
    thumbnail: bgPodium,
    url: bgPodium,
  },
  {
    id: 'bg-office',
    title: 'Văn phòng Bắc Âu',
    thumbnail: bgOffice,
    url: bgOffice,
  },
];

export const COLOR_PRESETS = [
  { id: 'white', name: 'Trắng TMĐT', value: '#FFFFFF', border: true },
  { id: 'light-gray', name: 'Xám Studio', value: '#F3F4F6' },
  { id: 'passport-blue-1', name: 'Xanh ảnh thẻ 1', value: '#0055A5' },
  { id: 'passport-blue-2', name: 'Xanh ảnh thẻ 2', value: '#1E3A8A' },
  { id: 'black', name: 'Đen sang trọng', value: '#121212' },
  { id: 'peach', name: 'Cam đào pastel', value: '#FFEDD5' },
  { id: 'mint', name: 'Xanh bạc hà', value: '#D1FAE5' },
  { id: 'rose', name: 'Hồng phấn', value: '#FFE4E6' },
  { id: 'lavender', name: 'Tím oải hương', value: '#EDE9FE' },
  { id: 'dark-slate', name: 'Xám than', value: '#1E293B' },
];

export const GRADIENT_PRESETS = [
  { id: 'studio', name: 'Ánh sáng Studio', value: 'studio', css: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #94a3b8 100%)' },
  { id: 'sunset', name: 'Hoàng hôn ấm', value: 'sunset', css: 'linear-gradient(135deg, #fed7aa 0%, #f472b6 60%, #a855f7 100%)' },
  { id: 'modern', name: 'Không gian tối', value: 'modern', css: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
  { id: 'cyber', name: 'Cyber Neon', value: 'cyber', css: 'linear-gradient(135deg, #1e1b4b 0%, #0e7490 100%)' },
];

export const ASPECT_RATIOS = [
  { id: 'original', name: 'Gốc (Original)', ratio: null },
  { id: '1-1', name: '1:1 (Vuông TMĐT)', ratio: 1 },
  { id: '3-4', name: '3:4 (Ảnh thẻ / Portrait)', ratio: 3 / 4 },
  { id: '4-3', name: '4:3 (Tiêu chuẩn)', ratio: 4 / 3 },
  { id: '16-9', name: '16:9 (Màn ngang)', ratio: 16 / 9 },
  { id: '9-16', name: '9:16 (Story / TikTok)', ratio: 9 / 16 },
];
