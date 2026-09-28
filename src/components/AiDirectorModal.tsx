import React, { useState } from 'react';
import { Sparkles, X, Wand2, Lightbulb, Check } from 'lucide-react';
import { AudioProfile, TheScene, DirectorsNotes } from '../types/tts';

interface AiDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedScript: (data: {
    audioProfile: AudioProfile;
    scene: TheScene;
    directorsNotes: DirectorsNotes;
    sampleContext: string;
    transcript: string;
  }) => void;
}

export const AiDirectorModal: React.FC<AiDirectorModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedScript,
}) => {
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Hào hứng, cuốn hút (High Energy)');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/director/auto-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'Kể chuyện truyền cảm hoặc quảng cáo phong cách mới',
          genre,
          language,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi tạo kịch bản.');
      }

      onApplyGeneratedScript(json.data);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi yêu cầu Gemini sáng tạo kịch bản.');
    } finally {
      setLoading(false);
    }
  };

  const sampleIdeas = [
    'Review siêu xe điện thể thao phong cách Top Gear',
    'Thì thầm tâm sự đêm mưa tại quán cà phê Hà Nội cũ',
    'Giới thiệu tính năng AI thế hệ mới với phong cách năng động',
    'Kể câu chuyện cổ tích dân gian với giọng điệu trầm ấm',
    'Trailer bom tấn điện ảnh hành động giả tưởng năm 2050',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              AI Đạo Diễn Tự Động (Gemini Assistant)
            </h3>
            <p className="text-xs text-slate-400">
              Nhập ý tưởng để Gemini phác thảo toàn bộ 5 phần kịch bản chuẩn cấu trúc
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Chủ đề hoặc ý tưởng của bạn:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Bản tin công nghệ buổi sáng, Podcast đêm khuya..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Thể loại cảm xúc:
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="Hào hứng, cuốn hút (High Energy)">Hào hứng, bùng nổ</option>
                <option value="Thì thầm ấm áp, thư giãn (Proximity ASMR)">Thì thầm, ấm áp</option>
                <option value="Điện ảnh sử thi trầm hùng (Cinematic)">Điện ảnh sử thi</option>
                <option value="Sassy GenZ hài hước (Witty & Sarcastic)">Sassy, hài hước</option>
                <option value="Bản tin truyền hình chuẩn mực (News Anchor)">Bản tin trang trọng</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ngôn ngữ:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English (Tiếng Anh)</option>
              </select>
            </div>
          </div>

          {/* Quick Idea Chips */}
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Gợi ý nhanh:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(idea)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition text-left cursor-pointer"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang dàn cảnh...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Tạo Kịch Bản 5 Phần</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
