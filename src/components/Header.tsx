import React from 'react';
import { Mic2, Radio, Sparkles, Volume2, Sliders, Info, BookOpen, UploadCloud } from 'lucide-react';
import { DIRECTOR_PRESETS } from '../data/nuances';
import { DirectorPreset } from '../types/tts';

interface HeaderProps {
  onSelectPreset: (preset: DirectorPreset) => void;
  onOpenAiModal: () => void;
  onOpenGuideModal: () => void;
  onOpenMp3Modal: () => void;
  currentTakeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onOpenAiModal,
  onOpenGuideModal,
  onOpenMp3Modal,
  currentTakeCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-lg shadow-rose-500/20 text-white font-bold">
            <Mic2 className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                GEMINI VOICE DIRECTOR STUDIO
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  NATIVE TTS
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Kiến trúc đạo diễn 5 phần: Hồ Sơ Nhân Vật • Bối Cảnh • Chỉ Đạo Diễn Xuất • Bối Cảnh Điểm • Văn Bản
            </p>
          </div>
        </div>

        {/* Action Controls & Preset Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Bóc Tách MP3 & Tái Tạo Mới */}
          <button
            type="button"
            onClick={onOpenMp3Modal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition cursor-pointer"
            title="Tải file MP3 để bóc tách lời thoại và chất giọng theo 5 phần và xuất bản thu mới"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-200" />
            <span>BÓC TÁCH FILE MP3</span>
          </button>

          {/* Preset Selector */}
          <div className="relative flex items-center">
            <label htmlFor="preset-select" className="sr-only">Kịch bản mẫu</label>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-400">Mẫu Đạo Diễn:</span>
              <select
                id="preset-select"
                onChange={(e) => {
                  const found = DIRECTOR_PRESETS.find((p) => p.id === e.target.value);
                  if (found) onSelectPreset(found);
                }}
                className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer text-xs"
                defaultValue=""
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Chọn kịch bản kinh điển...
                </option>
                {DIRECTOR_PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Auto-Compose Button */}
          <button
            type="button"
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition cursor-pointer"
            title="Sử dụng AI Gemini tự động sáng tạo nhân vật & dàn cảnh 5 phần"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Đạo Diễn Tự Động</span>
          </button>

          {/* Guide Button */}
          <button
            type="button"
            onClick={onOpenGuideModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
            title="Xem hướng dẫn cấu trúc đạo diễn âm thanh Gemini"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Quy Chuẩn TTS</span>
          </button>

          {/* Live Studio Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-mono text-slate-300">TAKES: {currentTakeCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

