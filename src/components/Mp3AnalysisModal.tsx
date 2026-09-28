import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileAudio,
  Sparkles,
  X,
  Play,
  Pause,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Volume2,
  User,
  MapPin,
  Megaphone,
  Compass,
  FileText,
  Sliders,
  Download,
} from 'lucide-react';
import { AudioProfile, TheScene, DirectorsNotes, TakeRecord } from '../types/tts';
import { downloadAudioFile } from '../utils/audio';

interface Mp3AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisAndReproduceComplete: (result: {
    decomposedData: {
      audioProfile: AudioProfile;
      scene: TheScene;
      directorsNotes: DirectorsNotes;
      sampleContext: string;
      transcript: string;
      suggestedVoice: string;
      suggestedSpeed: number;
      suggestedNuanceId: number;
      analysisSummary?: string;
    };
    newTake: TakeRecord;
  }) => void;
  nextTakeNumber: number;
}

export const Mp3AnalysisModal: React.FC<Mp3AnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalysisAndReproduceComplete,
  nextTakeNumber,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('audio/mp3');
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);

  // States
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'synthesizing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result storage
  const [analysisResult, setAnalysisResult] = useState<{
    decomposedData: any;
    newTake: TakeRecord;
  } | null>(null);

  // Audio players
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isPlayingGenerated, setIsPlayingGenerated] = useState(false);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const generatedAudioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile) return;

    // Check mime type
    const validAudioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/ogg'];
    if (!validAudioTypes.some(t => selectedFile.type.includes(t)) && !selectedFile.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      setErrorMessage('Vui lòng chọn tệp âm thanh hợp lệ (.mp3, .wav, .m4a, .ogg)');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('Kích thước tệp quá lớn (tối đa 25MB). Vui lòng chọn tệp ngắn hơn để xử lý nhanh nhất.');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setStatus('idle');
    setAnalysisResult(null);

    const blobUrl = URL.createObjectURL(selectedFile);
    setOriginalAudioUrl(blobUrl);

    // Read as Base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // split data:audio/...;base64,
      const base64Parts = result.split(',');
      const mime = base64Parts[0].match(/:(.*?);/)?.[1] || selectedFile.type || 'audio/mp3';
      setFileMimeType(mime);
      setFileBase64(base64Parts[1]);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!fileBase64 || !file) {
      setErrorMessage('Vui lòng tải lên tệp âm thanh trước khi bắt đầu.');
      return;
    }

    setStatus('analyzing');
    setStatusMessage('1/3: AI đang lắng nghe và bóc tách 5 thành phần đạo diễn: Hồ sơ nhân vật, Bối cảnh âm học, Chỉ đạo diễn xuất, Bối cảnh điểm, Lời thoại...');
    setErrorMessage(null);

    try {
      let msgStep = 1;
      const progressTimer = setInterval(() => {
        msgStep++;
        if (msgStep === 2) {
          setStatusMessage('2/3: Đang bóc tách 5 thành phần đạo diễn và đối chiếu dữ liệu âm học...');
        } else if (msgStep === 3) {
          setStatusMessage('3/3: Đang khởi tạo mô hình Gemini Audio TTS để biểu diễn bản thu mới...');
          clearInterval(progressTimer);
        }
      }, 3000);

      const response = await fetch('/api/audio/analyze-and-reproduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: fileBase64,
          mimeType: fileMimeType,
          originalFileName: file.name,
          takeNumber: nextTakeNumber,
        }),
      });

      clearInterval(progressTimer);

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Lỗi bóc tách và tái tạo từ file âm thanh.');
      }

      setStatus('synthesizing');
      setStatusMessage('Đang hoàn thiện và xuất bản thu âm AI mới...');

      const decomp = data.decomposedData;
      const gen = data.generatedAudio;

      const newTake: TakeRecord = {
        id: `take-${Date.now()}`,
        takeNumber: nextTakeNumber,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        audioBase64: gen.audioBase64,
        mimeType: gen.mimeType || 'audio/wav',
        characterName: decomp.audioProfile?.name || 'Voice Talent',
        characterRole: decomp.audioProfile?.role || 'Performer',
        sceneTitle: decomp.scene?.title || 'Phân Tích Từ MP3',
        nuanceName: `Tái Tạo Từ MP3 (Sắc thái #${decomp.suggestedNuanceId || 1})`,
        nuanceId: decomp.suggestedNuanceId || 1,
        speed: decomp.suggestedSpeed || 1.0,
        voiceName: decomp.suggestedVoice || 'Puck',
        transcript: decomp.transcript,
        sourceType: 'mp3-analysis',
        originalFileName: file.name,
        analysisSummary: decomp.analysisSummary || '',
        fullData: {
          audioProfile: decomp.audioProfile,
          scene: decomp.scene,
          directorsNotes: decomp.directorsNotes,
          sampleContext: decomp.sampleContext,
          transcript: decomp.transcript,
        },
      };

      setAnalysisResult({
        decomposedData: decomp,
        newTake,
      });

      setStatus('success');
      setStatusMessage('Hoàn tất! Bản thu mới đã được khởi tạo và sẵn sàng nạp thẳng vào Studio & Danh Sách Lịch Sử.');
    } catch (err: any) {
      console.warn('[MP3 Analysis Notice]', err?.message || err);
      setStatus('error');
      let rawMsg = err.message || 'Không thể xử lý tệp âm thanh. Vui lòng thử lại.';
      try {
        const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            rawMsg = parsed.error.message;
          }
        }
      } catch {
        // keep rawMsg
      }

      if (rawMsg.includes('high demand') || rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
        setErrorMessage(
          'Máy chủ AI đang có lượng truy cập cao tạm thời (503). Hệ thống đã tự động kích hoạt tuyến xử lý dự phòng, bạn hãy bấm "Thử Phân Tích Lại" bên dưới.'
        );
      } else if (rawMsg.includes('429') || rawMsg.includes('quota') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        setErrorMessage(
          'Hạn mức yêu cầu tức thời tạm thời đạt giới hạn (429). Hệ thống đã chuyển sang mô hình Flash dự phòng, bạn hãy bấm "Thử Phân Tích Lại".'
        );
      } else {
        setErrorMessage(rawMsg);
      }
    }
  };

  const handleApplyToStudioAndClose = () => {
    if (analysisResult) {
      onAnalysisAndReproduceComplete(analysisResult);
      onClose();
    }
  };

  // Toggle Original Audio
  const togglePlayOriginal = () => {
    if (!originalAudioRef.current) return;
    if (isPlayingOriginal) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    } else {
      if (generatedAudioRef.current) {
        generatedAudioRef.current.pause();
        setIsPlayingGenerated(false);
      }
      originalAudioRef.current.play();
      setIsPlayingOriginal(true);
    }
  };

  // Toggle Generated Audio
  const togglePlayGenerated = () => {
    if (!generatedAudioRef.current) return;
    if (isPlayingGenerated) {
      generatedAudioRef.current.pause();
      setIsPlayingGenerated(false);
    } else {
      if (originalAudioRef.current) {
        originalAudioRef.current.pause();
        setIsPlayingOriginal(false);
      }
      generatedAudioRef.current.play();
      setIsPlayingGenerated(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-7 text-slate-100">
        {/* Hidden Audios */}
        {originalAudioUrl && (
          <audio
            ref={originalAudioRef}
            src={originalAudioUrl}
            onEnded={() => setIsPlayingOriginal(false)}
            className="hidden"
          />
        )}
        {analysisResult?.newTake?.audioBase64 && (
          <audio
            ref={generatedAudioRef}
            src={`data:${analysisResult.newTake.mimeType || 'audio/wav'};base64,${analysisResult.newTake.audioBase64}`}
            onEnded={() => setIsPlayingGenerated(false)}
            className="hidden"
          />
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <FileAudio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                TÁI TẠO BẢN THU GIỌNG NÓI MỚI "COPY 100%" TỪ FILE MP3
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                100% REPLICA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Bóc tách và tái tạo bản thu mới hoàn toàn từ giọng nói trong file MP3 dựa trên 5 thông tin: 1. Audio Profile, 2. The Scene, 3. Director's Notes, 4. Sample Context, 5. Transcript.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Upload Dropzone */}
        {status !== 'success' && (
          <div className="space-y-4">
            {/* 5-Field Target Architecture Banner */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-900 border border-amber-500/20">
                <span className="text-amber-400 font-bold block">1. Audio Profile</span>
                <span className="text-slate-400 text-[10px]">Hồ sơ & Âm sắc</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-cyan-500/20">
                <span className="text-cyan-400 font-bold block">2. The Scene</span>
                <span className="text-slate-400 text-[10px]">Bối cảnh & Không gian</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-rose-500/20">
                <span className="text-rose-400 font-bold block">3. Director's Notes</span>
                <span className="text-slate-400 text-[10px]">Chỉ đạo diễn xuất</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/20">
                <span className="text-emerald-400 font-bold block">4. Sample Context</span>
                <span className="text-slate-400 text-[10px]">Bối cảnh xuất phát</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2 rounded-lg bg-purple-950/40 border border-purple-500/40">
                <span className="text-purple-300 font-bold block">5. TRANSCRIPT</span>
                <span className="text-emerald-300 font-semibold text-[10px]">Duy nhất đọc ra tiếng</span>
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition ${
                file
                  ? 'border-cyan-500/50 bg-cyan-950/10'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-full bg-slate-900 text-cyan-400 border border-slate-800 shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <span className="text-sm font-semibold text-white block">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng bóc tách
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">
                      Kéo thả tệp MP3 vào đây, hoặc nhấn để duyệt tệp
                    </span>
                    <span className="text-xs text-slate-400">
                      Hỗ trợ MP3, WAV, M4A, OGG (Khuyên dùng đoạn thoại từ 5s - 60s để phân tích sâu nhất)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Original File Preview Player */}
            {file && originalAudioUrl && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={togglePlayOriginal}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition shadow"
                  >
                    {isPlayingOriginal ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    )}
                  </button>
                  <span className="text-xs font-medium text-slate-300">
                    Nghe thử tệp MP3 gốc đã chọn: <strong className="text-white">{file.name}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">Tệp Gốc</span>
              </div>
            )}

            {/* Processing State Indicator */}
            {(status === 'analyzing' || status === 'synthesizing') && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="font-bold uppercase tracking-wider text-cyan-300">
                    ĐANG XỬ LÝ BÓC TÁCH & TÁI TẠO BẢN THU...
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{statusMessage}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}

            {/* Process Action Button */}
            {status === 'idle' && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={!file}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25 transition cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>BẮT ĐẦU BÓC TÁCH & TÁI TẠO BẢN THU MỚI</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Success Review Screen (5 Decomposed Elements & Comparison) */}
        {status === 'success' && analysisResult && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Success Banner */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-300">
                    Bóc tách & Tái tạo thành công Take #{analysisResult.newTake.takeNumber}!
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Mô hình đã phân tích trọn vẹn 5 phần từ file MP3 và biểu diễn bản thu mới bám sát 100%.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% MATCH
              </span>
            </div>

            {/* Side-by-Side Audio Comparison Player */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              {/* Original Audio Card */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    [Tệp Gốc Đã Tải Lên]
                  </span>
                  <p className="text-xs font-semibold text-slate-200 line-clamp-1">{file?.name}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayOriginal}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 cursor-pointer transition shadow"
                  >
                    {isPlayingOriginal ? (
                      <Pause className="w-4 h-4 fill-cyan-400" />
                    ) : (
                      <Play className="w-4 h-4 fill-cyan-400 translate-x-0.5" />
                    )}
                  </button>
                  <span className="text-xs text-slate-300">
                    {isPlayingOriginal ? 'Đang phát file gốc...' : 'Nghe file gốc'}
                  </span>
                </div>
              </div>

              {/* Generated Audio Card */}
              <div className="p-3 rounded-lg bg-slate-900 border border-rose-500/40 flex flex-col justify-between shadow-lg shadow-rose-500/5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block mb-1">
                      [Bản Thu Mới Gemini TTS]
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      Take #{analysisResult.newTake.takeNumber}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-100 line-clamp-1">
                    {analysisResult.newTake.characterName} • Giọng: {analysisResult.newTake.voiceName}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayGenerated}
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition shadow-md shadow-rose-600/30"
                    >
                      {isPlayingGenerated ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      )}
                    </button>
                    <span className="text-xs text-slate-200 font-medium">
                      {isPlayingGenerated ? 'Đang phát bản mới...' : 'Nghe bản thu mới'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const cleanName = (analysisResult.newTake.characterName || 'Voice').replace(/\s+/g, '_');
                      downloadAudioFile(
                        analysisResult.newTake.audioBase64,
                        `Take-${analysisResult.newTake.takeNumber.toString().padStart(2, '0')}_${cleanName}_Recreated.mp3`,
                        analysisResult.newTake.mimeType || 'audio/wav'
                      );
                    }}
                    className="p-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition"
                    title="Tải tệp MP3 bản mới này"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5 DECOMPOSED DIRECTORIAL COMPONENTS */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                5 THÔNG TIN NỘI DUNG ĐÃ BÓC TÁCH CHI TIẾT TỪ MP3:
              </h5>

              {/* 1. Audio Profile */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Audio Profile (Hồ Sơ Nhân Vật):</span>
                  <span className="text-white font-semibold">
                    {analysisResult.decomposedData.audioProfile?.name}
                  </span>
                  <span className="text-slate-400 font-normal">
                    — "{analysisResult.decomposedData.audioProfile?.role}"
                  </span>
                </div>
                <p className="text-slate-400 pl-5 leading-relaxed">
                  {analysisResult.decomposedData.audioProfile?.background}
                </p>
              </div>

              {/* 2. The Scene */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>2. The Scene (Bối Cảnh & Không Gian Vật Lý):</span>
                  <span className="text-white font-semibold">
                    {analysisResult.decomposedData.scene?.title}
                  </span>
                </div>
                <p className="text-slate-400 pl-5 leading-relaxed">
                  {analysisResult.decomposedData.scene?.description}
                </p>
              </div>

              {/* 3. Director's Notes */}
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 text-xs">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1.5">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>3. Director's Notes (Chỉ Đạo Diễn Xuất Âm Thanh):</span>
                </div>
                <div className="pl-5 space-y-1 text-slate-300">
                  <p><strong className="text-slate-400">Style:</strong> {analysisResult.decomposedData.directorsNotes?.style}</p>
                  <p><strong className="text-slate-400">Dynamics:</strong> {analysisResult.decomposedData.directorsNotes?.dynamics}</p>
                  <p><strong className="text-slate-400">Pace:</strong> {analysisResult.decomposedData.directorsNotes?.pace}</p>
                  <p><strong className="text-slate-400">Accent:</strong> {analysisResult.decomposedData.directorsNotes?.accent}</p>
                  {analysisResult.decomposedData.directorsNotes?.customNotes && (
                    <p><strong className="text-slate-400">Ghi chú:</strong> {analysisResult.decomposedData.directorsNotes?.customNotes}</p>
                  )}
                </div>
              </div>

              {/* 4. Sample Context */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>4. Sample Context (Bối Cảnh Xuất Phát Điểm):</span>
                </div>
                <p className="text-slate-400 pl-5 leading-relaxed">
                  {analysisResult.decomposedData.sampleContext}
                </p>
              </div>

              {/* 5. Transcript */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border-2 border-purple-500/60 shadow-lg shadow-purple-950/40 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-purple-300 font-bold mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>5. TRANSCRIPT (Văn Bản Đọc / Lời Thoại Đã Bóc Tách):</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                    🎯 DUY NHẤT ĐƯỢC ĐỌC THÀNH TIẾNG
                  </span>
                </div>
                <p className="text-white italic pl-5 leading-relaxed font-sans text-sm bg-slate-950/60 p-2.5 rounded-lg border border-purple-500/20">
                  "{analysisResult.decomposedData.transcript}"
                </p>
                <p className="text-[11px] text-slate-400 mt-2 pl-5">
                  * Giọng đọc tạo ra chỉ áp dụng cho đoạn lời thoại này. 4 mục trên (Hồ sơ, Bối cảnh, Chỉ đạo diễn xuất, Bối cảnh xuất phát điểm) được dùng làm chỉ dẫn âm học và cảm xúc, tuyệt đối không đọc thành tiếng.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  <strong>Quy tắc giọng đọc:</strong> Chỉ phát âm Lời Thoại (Mục 5). 4 mục thông tin còn lại dùng định hình diễn xuất, tuyệt đối không đọc ra tiếng.
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setFile(null);
                    setOriginalAudioUrl(null);
                    setAnalysisResult(null);
                  }}
                  className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Bóc tách tệp khác
                </button>

                <button
                  type="button"
                  onClick={handleApplyToStudioAndClose}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>NẠP VÀO STUDIO & ĐÓNG</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
