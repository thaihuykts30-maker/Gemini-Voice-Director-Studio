import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Radio,
  Zap,
  Heart,
  Film,
  Compass,
  Layers,
  Music,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  UploadCloud,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { NuanceVariant, TakeRecord } from '../types/tts';
import { NUANCE_VARIANTS, PREBUILT_VOICES } from '../data/nuances';
import { downloadAudioFile, formatSeconds } from '../utils/audio';

interface StudioMonitorColumnProps {
  // Speed Slider
  speed: number;
  setSpeed: (val: number) => void;

  // Nuances
  selectedNuanceId: number;
  setSelectedNuanceId: (id: number) => void;

  // Voice Selection
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;

  // Action Triggers
  isGenerating: boolean;
  onPerformTTS: () => void;
  onOpenMp3Modal?: () => void;

  // Current Take
  currentTake: TakeRecord | null;
  takeCount: number;

  // Validation
  hasTranscript: boolean;

  // Locked Voice Mode
  lockedTake?: TakeRecord | null;
  onUnlockVoice?: () => void;
}

export const StudioMonitorColumn: React.FC<StudioMonitorColumnProps> = ({
  speed,
  setSpeed,
  selectedNuanceId,
  setSelectedNuanceId,
  selectedVoice,
  setSelectedVoice,
  isGenerating,
  onPerformTTS,
  onOpenMp3Modal,
  currentTake,
  takeCount,
  hasTranscript,
  lockedTake,
  onUnlockVoice,
}) => {
  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Active nuance object
  const activeNuance = NUANCE_VARIANTS.find((n) => n.id === selectedNuanceId) || NUANCE_VARIANTS[0];

  // Update audio when currentTake changes
  useEffect(() => {
    if (currentTake?.audioBase64) {
      const mime = currentTake.mimeType || 'audio/wav';
      const audioSrc = `data:${mime};base64,${currentTake.audioBase64}`;
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.load();
        // Auto play on new take
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [currentTake]);

  // Audio Event Listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTake) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.error('Play error', e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Download Handler for Nút "TẢI MP3"
  const handleDownloadMp3 = () => {
    if (!currentTake) return;
    const cleanName = (currentTake.characterName || 'Voice').replace(/\s+/g, '_');
    const cleanNuance = (currentTake.nuanceName || 'Take').replace(/\s+/g, '_');
    const filename = `Take-${currentTake.takeNumber.toString().padStart(2, '0')}_${cleanName}_${cleanNuance}.mp3`;
    downloadAudioFile(currentTake.audioBase64, filename, currentTake.mimeType || 'audio/wav');
  };

  // Animated Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      const numBars = 48;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 6;
        if (isGenerating) {
          // Energetic pulsing during generation
          barHeight = 10 + Math.sin(phase * 4 + i * 0.4) * 20 + Math.random() * 12;
        } else if (isPlaying) {
          // Dynamic audio-like visualizer during playback
          const progress = duration > 0 ? currentTime / duration : 0;
          const distFromHead = Math.abs(i / numBars - progress);
          const weight = Math.max(0.2, 1 - distFromHead * 2);
          barHeight = 8 + Math.sin(phase * 5 + i * 0.6) * 22 * weight + Math.sin(phase * 2) * 8;
        } else if (currentTake) {
          // Static calm sound print
          barHeight = 6 + Math.sin(i * 0.3) * 12 + Math.cos(i * 0.8) * 8;
        }

        const x = i * (barWidth + 2);
        const y = mid - barHeight / 2;

        // Gradient coloring
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isGenerating) {
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(1, '#fbbf24');
        } else if (isPlaying) {
          grad.addColorStop(0, '#ec4899');
          grad.addColorStop(0.5, '#a855f7');
          grad.addColorStop(1, '#3b82f6');
        } else {
          grad.addColorStop(0, '#475569');
          grad.addColorStop(1, '#334155');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, Math.max(2, y), barWidth, Math.max(4, barHeight), 2);
        ctx.fill();
      }

      phase += 0.05;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, isGenerating, currentTime, duration, currentTake]);

  // Speed description helper
  const getSpeedLabel = (val: number) => {
    if (val <= 0.7) return 'The Drift (Cực chậm, từ ngữ tan chảy)';
    if (val <= 0.85) return 'Thư thả, điềm đạm & sâu lắng';
    if (val <= 1.05) return 'Chuẩn phòng thu tự nhiên';
    if (val <= 1.3) return 'Sôi nổi, nhịp nảy (Bouncing cadence)';
    return 'Dồn dập cực nhanh (Shorts / GenZ)';
  };

  const getNuanceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'Heart':
        return <Heart className="w-4 h-4" />;
      case 'Film':
        return <Film className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Radio':
        return <Radio className="w-4 h-4" />;
      case 'Compass':
        return <Compass className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
      {/* Invisible HTML5 Audio */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Header: STUDIO MONITOR TAKE */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold border border-indigo-500/30">
            C2
          </span>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Studio Monitor Take
              {isGenerating && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  RECORDING ON AIR
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Bàn giám sát âm thanh, điều khiển tốc độ, 6 sắc thái diễn xuất & xuất bản
            </p>
          </div>
        </div>

        {/* Voice Talent Selector */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="voice-select" className="text-xs text-slate-400 font-medium">Giọng:</label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-800 text-rose-300 focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            {PREBUILT_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender} - {v.timbre})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* THANH TỐC ĐỘ GIỌNG ĐỌC */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-200">
              Thanh Tốc Độ Giọng Đọc
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {speed.toFixed(2)}x
          </span>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>0.5x (Rất chậm)</span>
            <span className="text-cyan-400 font-medium">{getSpeedLabel(speed)}</span>
            <span>2.0x (Cực nhanh)</span>
          </div>
        </div>

        {/* Quick Speed Preset Buttons */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[
            { val: 0.75, label: '0.75x The Drift' },
            { val: 1.0, label: '1.0x Chuẩn' },
            { val: 1.2, label: '1.2x Sôi Nổi' },
            { val: 1.5, label: '1.5x Nhanh' },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => setSpeed(preset.val)}
              className={`py-1 text-[11px] font-mono rounded-md border transition cursor-pointer ${
                Math.abs(speed - preset.val) < 0.03
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 SẮC THÁI BIẾN THỂ (MỖI LẦN THU 1 KẾT QUẢ KHÁC NHAU) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-200">
              6 Sắc Thái Biến Thể
            </h3>
          </div>
          <span className="text-[10px] text-amber-400 font-medium">
            (Mỗi lần thu 1 kết quả khác nhau)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {NUANCE_VARIANTS.map((nuance) => {
            const isSelected = selectedNuanceId === nuance.id;
            return (
              <button
                key={nuance.id}
                type="button"
                onClick={() => {
                  setSelectedNuanceId(nuance.id);
                  setSpeed(nuance.defaultSpeed);
                }}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? `${nuance.badgeBg} border-2 shadow-lg shadow-${nuance.color}/10 ring-1 ring-white/10`
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                {/* Active Glow Dot */}
                {isSelected && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: nuance.color }}
                  />
                )}

                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="p-1 rounded-md"
                    style={{
                      backgroundColor: `${nuance.color}25`,
                      color: nuance.color,
                    }}
                  >
                    {getNuanceIcon(nuance.iconName)}
                  </div>
                  <span className="text-xs font-bold truncate">
                    {nuance.name}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 font-medium line-clamp-1 mb-1">
                  {nuance.tagline}
                </span>

                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {nuance.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AUDIO MONITOR SCREEN & WAVEFORM */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
              AUDIO MONITOR OUTPUT
            </span>
          </div>
          {currentTake ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              TAKE #{currentTake.takeNumber} READY
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-400">
              CHƯA CÓ BẢN THU NÀO
            </span>
          )}
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="relative w-full h-16 bg-slate-900/80 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80">
          <canvas
            ref={canvasRef}
            width={480}
            height={64}
            className="w-full h-full object-cover"
          />
          {!currentTake && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Nhấn nút "BIỂU DIỄN TTS" để kích hoạt thu âm
            </div>
          )}
        </div>

        {/* Audio Scrubber & Controls */}
        {currentTake && (
          <div className="space-y-2 pt-1">
            {/* Scrubber */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                {formatSeconds(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="text-[11px] font-mono text-slate-400 w-10">
                {formatSeconds(duration)}
              </span>
            </div>

            {/* Playback & Volume Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-md shadow-rose-600/30"
                  title={isPlaying ? 'Tạm dừng' : 'Phát bản thu'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  )}
                </button>

                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-slate-300"
                  />
                </div>
              </div>

              {/* Take Info Chip */}
              <div className="text-right text-[11px] text-slate-400">
                <span className="text-slate-200 font-semibold">{currentTake.characterName}</span>
                {' • '}
                <span className="text-amber-400">{currentTake.nuanceName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BANNER THÔNG BÁO KHÓA MẪU GIỌNG NẾU ĐANG KÍCH HOẠT */}
      {lockedTake && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border border-amber-500/60 shadow-lg shadow-amber-500/10 mb-3 flex items-center justify-between gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
              <Lock className="w-4 h-4 fill-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  KHÓA 100% THEO TAKE #{lockedTake.takeNumber}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {lockedTake.characterName}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate font-mono">
                {lockedTake.voiceName} • {lockedTake.speed}x • Sắc thái: {lockedTake.nuanceName}
              </p>
            </div>
          </div>
          {onUnlockVoice && (
            <button
              type="button"
              onClick={onUnlockVoice}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
              title="Hủy khóa mẫu giọng"
            >
              Hủy khóa
            </button>
          )}
        </div>
      )}

      {/* TWO PRIMARY ACTION BUTTONS: "BIỂU DIỄN TTS" & "TẢI MP3" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* NÚT BIỂU DIỄN TTS */}
        <button
          type="button"
          onClick={onPerformTTS}
          disabled={isGenerating || !hasTranscript}
          className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-xl transition cursor-pointer relative overflow-hidden ${
            isGenerating
              ? 'bg-amber-950 border border-amber-500 text-amber-300 cursor-not-allowed'
              : !hasTranscript
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : lockedTake
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black shadow-amber-500/30 ring-2 ring-amber-400/50 active:scale-[0.98]'
              : 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-rose-600/30 active:scale-[0.98]'
          }`}
          title={
            !hasTranscript
              ? 'Vui lòng nhập Transcript trước'
              : lockedTake
              ? `Xuất bản thu mới áp dụng 100% mẫu giọng Take #${lockedTake.takeNumber}`
              : 'Kích hoạt thu âm theo chỉ đạo'
          }
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
              <span>ĐANG XUẤT TAKE #{takeCount + 1}...</span>
            </>
          ) : lockedTake ? (
            <>
              <Lock className="w-4 h-4 fill-slate-950 shrink-0" />
              <span className="truncate">XUẤT TAKE GIỌNG ĐÃ KHÓA</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-white shadow-sm shadow-white animate-pulse"></div>
              <span>BIỂU DIỄN TTS</span>
            </>
          )}
        </button>

        {/* NÚT TẢI MP3 */}
        <button
          type="button"
          onClick={handleDownloadMp3}
          disabled={!currentTake}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition cursor-pointer border ${
            currentTake
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-lg shadow-emerald-600/25 active:scale-[0.98]'
              : 'bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title={currentTake ? 'Tải tệp âm thanh MP3 về máy' : 'Chưa có âm thanh để tải'}
        >
          <Download className="w-4 h-4" />
          <span>TẢI MP3</span>
        </button>
      </div>

      {/* Directorial Advice Box */}
      <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
        <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300">Cơ chế Gemini Native Audio:</strong> Mỗi lần bấm{' '}
          <span className="text-rose-400 font-semibold">"BIỂU DIỄN TTS"</span> ứng với sắc thái được chọn,
          mô hình sẽ sinh một lần diễn xuất (Take) riêng biệt với biến tấu giọng nói, tiếng thở và năng lượng tự nhiên.
        </div>
      </div>

      {/* MP3 Forensic Upload Banner */}
      {onOpenMp3Modal && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 via-slate-900 to-blue-950/30 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Bóc Tách & Tái Tạo Từ File MP3
              </span>
              <span className="text-[11px] text-slate-400">
                Phân tích 5 phần và xuất bản thu mới bám sát 100%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMp3Modal}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer shrink-0"
          >
            Tải MP3 Lên
          </button>
        </div>
      )}
    </div>
  );
};
