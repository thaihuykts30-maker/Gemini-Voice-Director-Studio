import React, { useState } from 'react';
import {
  History,
  Play,
  Pause,
  Download,
  RotateCcw,
  Trash2,
  Sliders,
  User,
  MapPin,
  Sparkles,
  FileAudio,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { TakeRecord } from '../types/tts';
import { downloadAudioFile, formatSeconds } from '../utils/audio';

interface HistorySectionProps {
  takes: TakeRecord[];
  activePlayingTakeId: string | null;
  lockedTakeId?: string | null;
  onPlayTake: (take: TakeRecord) => void;
  onStopTake: () => void;
  onRestoreTake: (take: TakeRecord) => void;
  onDeleteTake: (id: string) => void;
  onClearAllTakes: () => void;
  onLockVoiceTake: (take: TakeRecord) => void;
  onUnlockVoiceTake: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  takes,
  activePlayingTakeId,
  lockedTakeId,
  onPlayTake,
  onStopTake,
  onRestoreTake,
  onDeleteTake,
  onClearAllTakes,
  onLockVoiceTake,
  onUnlockVoiceTake,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredTakes = takes.filter(
    (t) =>
      t.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nuanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transcript.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sceneTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="mt-8 p-4 lg:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white uppercase">
                Danh Sách Lịch Sử Giọng Đã Tạo
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-rose-300 border border-slate-700">
                {takes.length} BẢN THU (TAKES)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Lưu trữ các lần thu âm đã hoàn thành kèm thông số đạo diễn, có thể nghe lại, tải MP3 hoặc khôi phục kịch bản
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {takes.length > 0 && (
            <>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm nhân vật, sắc thái..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-rose-500 focus:outline-none text-white w-44 sm:w-56"
                />
              </div>

              {/* Nút Xóa Tất Cả đã được kích hoạt hoàn toàn với cơ chế xác nhận trực quan */}
              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/60 rounded-lg px-2.5 py-1 text-xs shadow-lg animate-in fade-in duration-200">
                  <span className="text-rose-200 font-semibold">Xóa hết {takes.length} bản thu?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowClearConfirm(false);
                      onClearAllTakes();
                    }}
                    className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer text-[11px] shadow-sm active:scale-95"
                  >
                    Xóa ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer text-[11px]"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-600 rounded-lg border border-rose-800/70 hover:border-rose-500 transition cursor-pointer font-bold shadow-md shadow-rose-950/30 active:scale-95"
                  title="Xóa toàn bộ lịch sử bản thu"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>XÓA TẤT CẢ</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Takes List or Empty State */}
      <div className="mt-4">
        {takes.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-slate-400 mx-auto mb-3">
              <FileAudio className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300 mb-1">
              Chưa có bản thu nào trong phiên làm việc
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Điền kịch bản 5 phần ở Cột 1 và nhấn nút "BIỂU DIỄN TTS" ở Cột 2 để sinh giọng nói AI đầu tiên!
            </p>
          </div>
        ) : filteredTakes.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Không tìm thấy bản thu nào khớp với từ khóa "{searchTerm}"
          </div>
        ) : (
          <div className="relative">
            {/* Thanh cuộn dọc ở góc phải (custom-scrollbar) giới hạn chiều cao tối đa làm gọn danh sách */}
            <div className="max-h-[500px] overflow-y-auto pr-2 sm:pr-3 space-y-3 custom-scrollbar">
              {filteredTakes.map((take) => {
                const isPlayingThis = activePlayingTakeId === take.id;
                const isThisTakeLocked = lockedTakeId === take.id;

              return (
                <div
                  key={take.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isThisTakeLocked
                      ? 'bg-slate-900/95 border-2 border-amber-500 shadow-xl shadow-amber-500/15 ring-2 ring-amber-500/30'
                      : isPlayingThis
                      ? 'bg-slate-900 border-rose-500/50 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Banner khi Take này đang được khóa 100% */}
                  {isThisTakeLocked && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent border border-amber-500/50 text-amber-200 text-xs font-bold mb-3 shadow-inner">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        ĐANG KHÓA 100% MẪU GIỌNG: Hãy nhập lời thoại mới vào mục TRANSCRIPT bên trên!
                      </span>
                      <button
                        type="button"
                        onClick={onUnlockVoiceTake}
                        className="text-[11px] underline hover:text-white cursor-pointer ml-auto"
                      >
                        Hủy khóa giọng
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Take Meta & Character */}
                    <div className="flex items-start gap-3">
                      {/* Play/Pause Button */}
                      <button
                        type="button"
                        onClick={() => (isPlayingThis ? onStopTake() : onPlayTake(take))}
                        className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition cursor-pointer shadow-md ${
                          isPlayingThis
                            ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-rose-400'
                        }`}
                        title={isPlayingThis ? 'Dừng phát' : 'Nghe bản thu này'}
                      >
                        {isPlayingThis ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-rose-400 translate-x-0.5" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            TAKE #{take.takeNumber.toString().padStart(2, '0')}
                          </span>
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            {take.characterName}
                          </span>
                          <span className="text-xs text-slate-400">({take.characterRole})</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {take.timestamp}
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {take.sourceType === 'mp3-analysis' && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-300" />
                              BẢN TÁI TẠO TỪ MP3
                              {take.originalFileName && (
                                <span className="text-[10px] text-cyan-400 font-normal">({take.originalFileName})</span>
                              )}
                            </span>
                          )}
                          {take.sourceType === 'locked-voice' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" />
                              KHÓA 100% TỪ TAKE #{take.lockedFromTakeNumber?.toString().padStart(2, '0')}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {take.sceneTitle}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                            Sắc thái: {take.nuanceName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                            {take.speed}x • Giọng: {take.voiceName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end lg:self-center flex-wrap">
                      {/* Nút KHÓA MẪU GIỌNG 100% */}
                      <button
                        type="button"
                        onClick={() => (isThisTakeLocked ? onUnlockVoiceTake() : onLockVoiceTake(take))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-md ${
                          isThisTakeLocked
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-300 font-black shadow-amber-500/30 ring-2 ring-amber-400/50'
                            : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-300 border border-amber-500/40 hover:border-amber-400'
                        }`}
                        title={
                          isThisTakeLocked
                            ? 'Đang khóa mẫu giọng này. Nhấn để hủy khóa.'
                            : 'Khóa 100% mẫu giọng & 4 phần kịch bản của Take này để nhập lời thoại mới vào Transcript'
                        }
                      >
                        {isThisTakeLocked ? (
                          <>
                            <Lock className="w-3.5 h-3.5 fill-current" />
                            <span>ĐÃ KHÓA 100%</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>KHÓA MẪU GIỌNG</span>
                          </>
                        )}
                      </button>

                      {/* Nút TẢI MP3 */}
                      <button
                        type="button"
                        onClick={() => {
                          const cleanName = (take.characterName || 'Voice').replace(/\s+/g, '_');
                          const cleanNuance = (take.nuanceName || 'Take').replace(/\s+/g, '_');
                          const filename = `Take-${take.takeNumber.toString().padStart(2, '0')}_${cleanName}_${cleanNuance}.mp3`;
                          downloadAudioFile(take.audioBase64, filename, take.mimeType || 'audio/wav');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                        title="Tải tệp MP3 về máy"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>TẢI MP3</span>
                      </button>

                      {/* Nút Tải lại vào phòng thu */}
                      <button
                        type="button"
                        onClick={() => onRestoreTake(take)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                        title="Tải lại toàn bộ kịch bản 5 phần của Take này lên Cột 1 để tiếp tục đạo diễn"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">Nạp Lại Studio</span>
                      </button>

                      {/* Xóa Take */}
                      <button
                        type="button"
                        onClick={() => onDeleteTake(take.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="Xóa bản thu này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Transcript Display with Tag Highlights */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg font-sans leading-relaxed">
                    <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-1">
                      Lời thoại đã thu:
                    </span>
                    <p className="italic">"{take.transcript}"</p>
                  </div>
                </div>
              );
            })}
            </div>
            {filteredTakes.length > 2 && (
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 px-1 border-t border-slate-800/40 pt-2">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Hiển thị {filteredTakes.length} bản thu trong danh sách
                </span>
                <span className="text-slate-500 italic">
                  Cuộn thanh trượt bên phải để xem thêm
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
