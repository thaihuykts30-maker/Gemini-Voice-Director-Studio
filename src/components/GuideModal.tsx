import React from 'react';
import { X, BookOpen, CheckCircle, Lightbulb, Volume2, Film } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Quy Chuẩn Đạo Diễn Âm Thanh Gemini Native Audio TTS
            </h3>
            <p className="text-xs text-slate-400">
              Kiến trúc chuyển đổi văn bản thành giọng nói truyền cảm như người thật
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-200 font-medium mb-1">
              Khác biệt của Gemini Native Audio Generation:
            </p>
            <p className="text-slate-400">
              Mô hình TTS truyền thống chỉ đọc những gì được viết. Nhưng mô hình Native Audio của Gemini hoạt động như một diễn viên lồng tiếng thực thụ trong phòng thu — nắm bắt không chỉ <strong>"nói cái gì"</strong> mà còn <strong>"nói như thế nào"</strong> trong một không gian vật lý và tâm lý xác định.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">1. Audio Profile (Hồ Sơ Nhân Vật)</span>
              <p className="text-slate-400">
                Xác lập bản sắc, tên gọi, nguyên mẫu (archetype) và độ tuổi của nhân vật. Việc gọi tên nhân vật giúp mô hình neo giữ tính cách xuyên suốt buổi thu.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-cyan-300 block mb-1">2. The Scene (Bối Cảnh & Không Gian)</span>
              <p className="text-slate-400">
                Thiết lập không gian vật lý, độ cách âm (rèm nhung, kính, phòng thu), ánh sáng và rung cảm cảm xúc (vibe).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-rose-300 block mb-1">3. Director's Notes (Chỉ Đạo Diễn Xuất)</span>
              <p className="text-slate-400">
                Chỉ dẫn cụ thể về Style (nụ cười âm thanh "Vocal smile"), Dynamics (lực phát âm), Pace (tiết tấu nảy hay trôi chậm), Accent (vùng miền), và tiếng thở.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-emerald-300 block mb-1">4. Sample Context (Bối Cảnh Khởi Điểm)</span>
              <p className="text-slate-400">
                Tạo đà tâm lý ban đầu để nhân vật bước vào cảnh diễn một cách tự nhiên nhất mà không bị gượng gạo.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <span className="font-bold text-purple-300 block mb-1">
              5. TRANSCRIPT & Ký Hiệu Diễn Xuất Đặc Biệt:
            </span>
            <p className="text-slate-300 mb-2">
              Chèn trực tiếp các ký hiệu âm thanh vào văn bản để mô hình thực hiện:
            </p>
            <ul className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
              <li><code className="text-purple-400">&lt;breath&gt;</code>: Tiếng lấy hơi / thở dài</li>
              <li><code className="text-amber-400">&lt;laugh&gt;</code>: Tiếng bật cười nhẹ</li>
              <li><code className="text-rose-400">&lt;gasp&gt;</code>: Tiếng hít thở kinh ngạc</li>
              <li><code className="text-cyan-400">|yeah|</code>: Đệm giọng khẳng định tự nhiên</li>
              <li><code className="text-emerald-400">|mhm|</code>: Đệm giọng lắng nghe gật gù</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
          >
            Đã Hiểu & Bắt Đầu Diễn Xuất
          </button>
        </div>
      </div>
    </div>
  );
};
