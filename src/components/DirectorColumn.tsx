import React, { useRef, useState } from 'react';
import {
  User,
  MapPin,
  Megaphone,
  Compass,
  FileText,
  PlusCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  Unlock,
  ArrowDown,
  Clipboard,
  ShieldCheck,
  Loader2,
  Wand2,
  X,
  FileCode,
} from 'lucide-react';
import { AudioProfile, TheScene, DirectorsNotes, TakeRecord } from '../types/tts';

interface DirectorColumnProps {
  audioProfile: AudioProfile;
  setAudioProfile: React.Dispatch<React.SetStateAction<AudioProfile>>;
  scene: TheScene;
  setScene: React.Dispatch<React.SetStateAction<TheScene>>;
  directorsNotes: DirectorsNotes;
  setDirectorsNotes: React.Dispatch<React.SetStateAction<DirectorsNotes>>;
  sampleContext: string;
  setSampleContext: React.Dispatch<React.SetStateAction<string>>;
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  lockedTake?: TakeRecord | null;
  onUnlockVoice?: () => void;
}

export const DirectorColumn: React.FC<DirectorColumnProps> = ({
  audioProfile,
  setAudioProfile,
  scene,
  setScene,
  directorsNotes,
  setDirectorsNotes,
  sampleContext,
  setSampleContext,
  transcript,
  setTranscript,
  lockedTake,
  onUnlockVoice,
}) => {
  const [copiedPrompt, setCopiedPrompt] = React.useState(false);
  const transcriptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // State for Natural Transcript Polishing
  const [isPolishing, setIsPolishing] = useState(false);
  const [activePolishingStyle, setActivePolishingStyle] = useState<'natural' | 'emotional' | 'energetic' | null>(null);
  const [previousTranscript, setPreviousTranscript] = useState<string | null>(null);
  const [polishNotification, setPolishNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // State for Quick 5-Part Script Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const SAMPLE_5_PART_PROMPT = `1. AUDIO PROFILE (Hồ sơ nhân vật)
Vocal Type (Chất giọng): Nam, trung niên, giọng trầm ấm / khàn
Accent (Phương ngữ/Vùng miền): Giọng Hà Nội chuẩn
Energy Level (Mức năng lượng): 3/10 (Trầm buồn, mệt mỏi)

2. THE SCENE (Bối cảnh & Không gian vật lý)
Acoustic Environment (Môi trường âm thanh): Thu âm trong studio cách âm hoàn toàn / trong xe hơi dưới trời mưa
Mic Distance (Khoảng cách Mic): Close-mic (ghé sát mic, tạo cảm giác thì thầm ASMR)

3. DIRECTOR'S NOTES (Chỉ đạo diễn xuất âm thanh)
Pacing (Nhịp độ): Chậm rãi, ngập ngừng ở đầu câu và tăng tốc ở cuối câu
Emotional Arc (Biến chuyển cảm xúc): Bắt đầu bằng sự điềm tĩnh, sau đó dần chuyển sang tức giận, kết thúc bằng tiếng thở dài thất vọng.
Nuances (Chi tiết vi mô): Có tiếng lấy hơi nhẹ trước những từ khóa quan trọng, nhấn mạnh vào các từ được bôi đậm, giọng hơi run khi xúc động.

4. SAMPLE CONTEXT (Bối cảnh xuất phát điểm - Tiền đề của lời thoại)
Background (Bối cảnh xảy ra): Nhân vật vừa trải qua một cuộc cãi vã lớn và đang ngồi một mình trong xe hơi dưới trời mưa.
Intention (Mục đích nói): Đang cố gắng thuyết phục người nghe đừng rời đi, mang tâm lý vừa van xin vừa bất lực.

5. TRANSCRIPT (Văn bản đọc)
[Thở dài nhẹ]
Tôi đã nói với bạn bao nhiêu lần rồi? [Ngập ngừng 1 giây]
Chuyện này... nó không hề đơn giản như bạn nghĩ đâu!
[Lấy hơi sâu, giọng nghẹn lại]
Nếu chúng ta tiếp tục, tất cả sẽ kết thúc.`;

  const handleApply5PartScript = async (customText?: string) => {
    const textToProcess = (customText || importText).trim();
    if (!textToProcess) {
      setPolishNotification({
        message: 'Vui lòng dán văn bản kịch bản 5 phần vào ô trước khi nạp!',
        type: 'warning',
      });
      setTimeout(() => setPolishNotification(null), 3000);
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch('/api/director/parse-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAudioProfile(result.data.audioProfile);
          setScene(result.data.scene);
          setDirectorsNotes(result.data.directorsNotes);
          setSampleContext(result.data.sampleContext);
          setTranscript(result.data.transcript);

          setIsImportModalOpen(false);
          setImportText('');
          setPolishNotification({
            message: '🎉 Đã phân tách chuẩn xác 100% kịch bản 5 phần vào các ô Đạo diễn và Lời thoại!',
            type: 'success',
          });
          setTimeout(() => setPolishNotification(null), 4000);
          return;
        }
      }
    } catch (_e) {
      console.log('Using local fallback parser');
    } finally {
      setIsImporting(false);
    }

    // Local Regex Fallback Parser
    let parsedTranscript = textToProcess;
    const tMatch = textToProcess.match(/(?:5\.\s*(?:TRANSCRIPT|Văn\s*Bản|Lời\s*Thoại)[^\n]*\n)([\s\S]*)$/i);
    if (tMatch && tMatch[1]) {
      parsedTranscript = tMatch[1].trim();
    }
    parsedTranscript = parsedTranscript
      .replace(/^[ \t]*(?:Hãy\s*chủ\s*động\s*chèn|Vui\s*lòng\s*đọc\s*chính\s*xác|Tuân\s*thủ\s*các\s*thẻ)[^\n]*\n?/gim, '')
      .replace(/\([^)]*(?:đọc\s*chính\s*xác|vui\s*lòng|hướng\s*dẫn|tuân\s*thủ)[^)]*\)/gi, '')
      .replace(/\[(?:thở\s*dài(?:\s*nhẹ)?|lấy\s*hơi(?:\s*sâu)?(?:,\s*giọng\s*nghẹn\s*lại)?|thở)[^\]]*\]/gi, '<breath>')
      .replace(/\[(?:ngập\s*ngừng(?:\s*\d+\s*giây)?|nghỉ)[^\]]*\]/gi, '... <breath> ')
      .trim();

    setTranscript(parsedTranscript);
    setIsImportModalOpen(false);
    setImportText('');
    setPolishNotification({
      message: '🎉 Đã phân tách kịch bản 5 phần vào Studio!',
      type: 'success',
    });
    setTimeout(() => setPolishNotification(null), 3500);
  };

  // Helper to insert special vocal bursts & backchannel tags at cursor position
  const insertTag = (tag: string) => {
    const textarea = transcriptTextareaRef.current;
    if (!textarea) {
      setTranscript((prev) => prev + ` ${tag} `);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = transcript;
    const newText = currentText.substring(0, start) + ` ${tag} ` + currentText.substring(end);
    setTranscript(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 50);
  };

  // Helper to handle AI dialogue polishing with 3 expressive styles
  const handlePolishTranscript = async (style: 'natural' | 'emotional' | 'energetic') => {
    if (!transcript.trim()) {
      setPolishNotification({
        message: 'Vui lòng nhập văn bản lời thoại vào ô bên dưới trước khi bấm chuốt tự nhiên!',
        type: 'warning',
      });
      setTimeout(() => setPolishNotification(null), 3500);
      return;
    }

    setIsPolishing(true);
    setActivePolishingStyle(style);
    setPreviousTranscript(transcript);

    const styleNames = {
      natural: 'Tự Nhiên & Ngắt Nghỉ',
      emotional: 'Cảm Thán & Cảm Xúc',
      energetic: 'Sôi Nổi & Dồn Dập',
    };

    try {
      const response = await fetch('/api/director/polish-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          style,
          characterName: audioProfile?.name,
          sceneTitle: scene?.title,
          directorsStyle: directorsNotes?.style,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.polishedTranscript) {
        setTranscript(data.polishedTranscript);
        setPolishNotification({
          message: `✨ Đã chuốt lời thoại theo phong cách [${styleNames[style]}]: ${data.summaryChanges || 'Đã thêm các ký hiệu diễn xuất và nhịp thở tự nhiên.'}`,
          type: 'success',
        });
        setTimeout(() => setPolishNotification(null), 4500);
      }
    } catch (_err) {
      let polished = transcript.trim();
      if (style === 'natural') {
        if (!polished.startsWith('<breath>') && !polished.startsWith('|')) {
          polished = '<breath> ' + polished;
        }
        polished = polished.replace(/,\s+/g, ', ... ');
        polished = polished.replace(/;\s+/g, '; ... <breath> ');
        polished = polished.replace(/([.!?])\s+(?=[A-ZÀ-Ỹa-zà-ỹ0-9])/g, '$1 ... <breath> ');
      } else if (style === 'emotional') {
        if (!polished.startsWith('<breath>') && !polished.startsWith('<gasp>')) {
          polished = '<breath> ' + polished;
        }
        polished = polished.replace(/\.\s+(?=[A-ZÀ-Ỹa-zà-ỹ0-9])/g, '...! <breath> ');
        if (polished.endsWith('.')) {
          polished = polished.slice(0, -1) + '...!';
        }
        if (!polished.includes('<gasp>')) {
          if (polished.includes('?')) {
            polished = polished.replace(/\?\s*/, '? <gasp> ');
          } else if (polished.includes('...!')) {
            polished = polished.replace(/\.\.\.!\s*/, '...! <gasp> ');
          }
        }
        polished = polished.replace(/,\s+/g, ', ... ');
      } else if (style === 'energetic') {
        if (!polished.includes('|yeah|')) {
          polished = '|yeah|! <breath> ' + polished;
        }
        polished = polished.replace(/\.\s+(?=[A-ZÀ-Ỹa-zà-ỹ0-9])/g, '! <breath> ');
        if (polished.endsWith('.')) {
          polished = polished.slice(0, -1) + '!';
        }
      }
      setTranscript(polished);
      setPolishNotification({
        message: `✨ Đã chuốt lời thoại theo phong cách [${styleNames[style]}].`,
        type: 'success',
      });
      setTimeout(() => setPolishNotification(null), 4000);
    } finally {
      setIsPolishing(false);
      setActivePolishingStyle(null);
    }
  };

  const handleUndoPolish = () => {
    if (previousTranscript !== null) {
      setTranscript(previousTranscript);
      setPreviousTranscript(null);
      setPolishNotification({
        message: 'Đã hoàn tác về văn bản lời thoại ban đầu.',
        type: 'success',
      });
      setTimeout(() => setPolishNotification(null), 3000);
    }
  };

  const copyFullCompositePrompt = () => {
    const fullText = `AUDIO PROFILE: ${audioProfile.name}
"${audioProfile.role}"
${audioProfile.background}

THE SCENE: ${scene.title}
${scene.description}

DIRECTOR'S NOTES
Style:
${directorsNotes.style}
Dynamics:
${directorsNotes.dynamics}
Pace:
${directorsNotes.pace}
Accent:
${directorsNotes.accent}
${directorsNotes.customNotes ? `Additional:\n${directorsNotes.customNotes}` : ''}

SAMPLE CONTEXT
${sampleContext}

TRANSCRIPT
${transcript}`;

    navigator.clipboard.writeText(fullText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 130) * 60));

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 font-mono text-xs font-bold border border-rose-500/30">
            C1
          </span>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              KỊCH BẢN ĐẠO DIỄN ÂM THANH (5 PHẦN)
            </h2>
            <p className="text-[11px] text-slate-400">
              Cấu trúc tiêu chuẩn Gemini Native Audio TTS giúp AI nhập vai chân thực như người thật
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
            title="Dán nhanh kịch bản 5 phần (Audio Profile, The Scene, Director's Notes, Sample Context, Transcript)"
          >
            <Clipboard className="w-3.5 h-3.5 fill-slate-950" />
            <span>Dán Prompt 5 Phần</span>
          </button>
          <button
            type="button"
            onClick={copyFullCompositePrompt}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
            title="Sao chép toàn bộ Prompt đạo diễn gộp"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* BANNER KHÓA 100% MẪU GIỌNG KHI ĐƯỢC CHỌN TỪ LỊCH SỬ BẢN THU */}
      {lockedTake && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/20 border-2 border-amber-500/70 shadow-lg shadow-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 shadow-md shadow-amber-500/30">
              <Lock className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  CHẾ ĐỘ KHÓA MẪU GIỌNG 100%
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-xs font-black">
                  TAKE #{lockedTake.takeNumber.toString().padStart(2, '0')}
                </span>
                <span className="text-xs font-bold text-white">
                  {lockedTake.characterName}
                </span>
                <span className="text-[11px] text-amber-200/90 font-mono">
                  ({lockedTake.voiceName} • {lockedTake.speed}x • Sắc thái: {lockedTake.nuanceName})
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                🔒 <strong>Đã cố định 100% 4 phần Đạo Diễn & Chất Giọng</strong> từ bản thu đã chọn. Hãy cuộn xuống mục <strong>5. TRANSCRIPT</strong> để nhập lời thoại mới đã hoàn chỉnh, AI sẽ đọc lời thoại mới với chuẩn xác chất giọng này!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('transcript-section');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const ta = document.getElementById('transcript-textarea') as HTMLTextAreaElement | null;
                ta?.focus();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Nhập Lời Thoại Mới</span>
            </button>
            {onUnlockVoice && (
              <button
                type="button"
                onClick={onUnlockVoice}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center gap-1"
                title="Hủy chế độ khóa mẫu giọng"
              >
                <Unlock className="w-3.5 h-3.5 text-rose-400" />
                <span>Hủy Khóa</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. AUDIO PROFILE (HỒ SƠ NHÂN VẬT) */}
      <div className={`p-4 rounded-xl transition ${
        lockedTake 
          ? 'bg-slate-950/80 border border-amber-500/40' 
          : 'bg-slate-950/60 border border-slate-800 hover:border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              1
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wide text-amber-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Audio Profile (Hồ Sơ Nhân Vật)
            </h3>
            {lockedTake && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                ĐÃ KHÓA 100%
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 italic">Định danh & tính cách cốt lõi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Tên nhân vật (Character Name) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={audioProfile.name}
              onChange={(e) => setAudioProfile({ ...audioProfile, name: e.target.value })}
              placeholder="VD: Jaz R., Monica A., Thảo Linh..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-white transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Hình mẫu & Vai diễn (Role / Archetype) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={audioProfile.role}
              onChange={(e) => setAudioProfile({ ...audioProfile, role: e.target.value })}
              placeholder='VD: "The Morning Hype", "Radio DJ", "Chuyên Gia Đọc Sách"...'
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Bối cảnh nhân vật, tuổi tác & xuất thân (Background & Persona)
          </label>
          <textarea
            rows={2}
            value={audioProfile.background}
            onChange={(e) => setAudioProfile({ ...audioProfile, background: e.target.value })}
            placeholder="VD: 26 tuổi, năng lượng 11/10, đứng nhún nhảy trên gót chân trước bàn mixer khổng lồ..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none text-white transition resize-none"
          />
        </div>
      </div>

      {/* 2. THE SCENE (BỐI CẢNH & KHÔNG GIAN VẬT LÝ) */}
      <div className={`p-4 rounded-xl transition ${
        lockedTake 
          ? 'bg-slate-950/80 border border-amber-500/40' 
          : 'bg-slate-950/60 border border-slate-800 hover:border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
              2
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wide text-cyan-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              The Scene (Bối Cảnh & Không Gian Vật Lý)
            </h3>
            {lockedTake && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                ĐÃ KHÓA 100%
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 italic">Môi trường, âm học & Vibe</span>
        </div>

        <div className="mb-3">
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Tên bối cảnh (Scene Title) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={scene.title}
            onChange={(e) => setScene({ ...scene, title: e.target.value })}
            placeholder="VD: The London Studio, Phòng Thu Rèm Nhung Đêm Khuya..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:outline-none text-white transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Mô tả không gian vật lý, ánh sáng, âm học & khoảng cách mic (Physical Environment & Acoustics)
          </label>
          <textarea
            rows={3}
            value={scene.description}
            onChange={(e) => setScene({ ...scene, description: e.target.value })}
            placeholder="VD: 10:00 PM phòng thu kính nhìn ra bầu trời London ngập ánh trăng. Đèn đỏ 'ON AIR' rực lửa. Không gian cách âm tỉ mỉ với hiệu ứng cận mic ấm áp..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:outline-none text-white transition resize-none"
          />
        </div>
      </div>

      {/* 3. DIRECTOR'S NOTES (CHỈ ĐẠO DIỄN XUẤT ÂM THANH) */}
      <div className={`p-4 rounded-xl transition ${
        lockedTake 
          ? 'bg-slate-950/80 border border-amber-500/40' 
          : 'bg-slate-950/60 border border-rose-500/20 hover:border-rose-500/40'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
              3
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wide text-rose-300 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              Director's Notes (Chỉ Đạo Diễn Xuất Âm Thanh)
            </h3>
            {lockedTake && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                ĐÃ KHÓA 100%
              </span>
            )}
          </div>
          <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
            Phần then chốt nhất
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Style */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Phong cách & Nụ cười giọng nói (Style / Vocal Smile)
            </label>
            <input
              type="text"
              value={directorsNotes.style}
              onChange={(e) => setDirectorsNotes({ ...directorsNotes, style: e.target.value })}
              placeholder='The "Vocal Smile": Nghe rõ nụ cười trong âm thanh, vòm họng nâng cao...'
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none text-white transition"
            />
          </div>

          {/* Dynamics */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Âm vực & Lực phát âm (Dynamics)
            </label>
            <input
              type="text"
              value={directorsNotes.dynamics}
              onChange={(e) => setDirectorsNotes({ ...directorsNotes, dynamics: e.target.value })}
              placeholder="High projection không hét, phụ âm nẩy, kéo dài nguyên âm cảm xúc..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none text-white transition"
            />
          </div>

          {/* Pace */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Tiết tấu & Nhịp điệu (Pacing & Cadence)
            </label>
            <input
              type="text"
              value={directorsNotes.pace}
              onChange={(e) => setDirectorsNotes({ ...directorsNotes, pace: e.target.value })}
              placeholder="Nhịp bouncing sôi nổi, chuyển tiếp mượt mà, không dead-air..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none text-white transition"
            />
          </div>

          {/* Accent */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Giọng vùng miền & Ngôn ngữ (Accent)
            </label>
            <input
              type="text"
              value={directorsNotes.accent}
              onChange={(e) => setDirectorsNotes({ ...directorsNotes, accent: e.target.value })}
              placeholder="Tiếng Việt chuẩn Hà Nội thanh lịch / Sài Gòn trẻ trung / London Brixton..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none text-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Ghi chú diễn xuất bổ sung (Custom Directorial Instructions)
          </label>
          <input
            type="text"
            value={directorsNotes.customNotes}
            onChange={(e) => setDirectorsNotes({ ...directorsNotes, customNotes: e.target.value })}
            placeholder="VD: Chèn tiếng thở sâu <breath> trước cao trào, tiếng cười khẩy <laugh>, đệm giọng |yeah|..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none text-white transition"
          />
        </div>
      </div>

      {/* 4. SAMPLE CONTEXT (BỐI CẢNH XUẤT PHÁT ĐIỂM) */}
      <div className={`p-4 rounded-xl transition ${
        lockedTake 
          ? 'bg-slate-950/80 border border-amber-500/40' 
          : 'bg-slate-950/60 border border-slate-800 hover:border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              4
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Sample Context (Bối Cảnh Xuất Phát Điểm)
            </h3>
            {lockedTake && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                ĐÃ KHÓA 100%
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 italic">Đòn bẩy tâm lý khởi đầu</span>
        </div>

        <div>
          <textarea
            rows={2}
            value={sampleContext}
            onChange={(e) => setSampleContext(e.target.value)}
            placeholder="VD: Jaz là tiêu chuẩn vàng của Top 40 radio, chuẩn bị kích hoạt một sự kiện âm nhạc đỉnh cao với năng lượng 11/10..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white transition resize-none"
          />
        </div>
      </div>

      {/* 5. TRANSCRIPT (VĂN BẢN ĐỌC / LỜI THOẠI) */}
      <div
        id="transcript-section"
        className={`p-4 rounded-xl transition-all ${
          lockedTake
            ? 'bg-slate-950/95 border-2 border-amber-500 shadow-2xl shadow-amber-500/20 ring-4 ring-amber-500/25'
            : 'bg-slate-950/60 border border-purple-500/30 hover:border-purple-500/50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
              5
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wide text-purple-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              TRANSCRIPT (VĂN BẢN ĐỌC / LỜI THOẠI)
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40 text-[10px] font-semibold">
              DUY NHẤT ĐƯỢC PHÁT ÂM
            </span>
            {lockedTake && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-sm">
                <Lock className="w-2.5 h-2.5 fill-current" />
                VÙNG NHẬP LỜI THOẠI MỚI (ÁP DỤNG 100% GIỌNG ĐÃ KHÓA)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>{wordCount} từ</span>
            <span>•</span>
            <span>~{estimatedSeconds}s thời lượng</span>
          </div>
        </div>

        {/* Ghi chú minh bạch về việc chỉ đọc Lời thoại (Mục 5) */}
        {!lockedTake && (
          <div className="mb-2.5 text-[11px] text-slate-400 flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Giọng đọc AI chỉ áp dụng và phát âm đoạn Lời thoại tại mục này. 4 mục trên (Hồ sơ, Bối cảnh, Chỉ đạo, Bối cảnh điểm) đóng vai trò định hình sắc thái & âm học, tuyệt đối không bị đọc thành tiếng.
            </span>
          </div>
        )}

        {/* Thông báo hướng dẫn khi đang ở Chế Độ Khóa Mẫu Giọng */}
        {lockedTake && (
          <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-slate-900 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <span>MẪU GIỌNG ĐÃ ĐƯỢC KHÓA 100% THEO TAKE #{lockedTake.takeNumber}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[10px] font-mono">
                    {lockedTake.characterName} ({lockedTake.voiceName})
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Nhập lời thoại mới đã hoàn chỉnh vào ô bên dưới. AI sẽ biểu diễn lời thoại mới này với 100% chất giọng, sắc thái, độ nẩy âm và bối cảnh phòng thu của Take #{lockedTake.takeNumber}!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setTranscript(text);
                    }
                  } catch (e) {
                    console.warn('Clipboard read error', e);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border border-purple-500/40 transition cursor-pointer active:scale-95"
                title="Dán nhanh lời thoại mới từ bộ nhớ tạm"
              >
                <Clipboard className="w-3 h-3" />
                <span>Dán Lời Thoại Mới</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback notification for transcript polishing */}
        {polishNotification && (
          <div
            className={`mb-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 transition animate-fadeIn ${
              polishNotification.type === 'warning'
                ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              {polishNotification.message}
            </span>
            <button
              type="button"
              onClick={() => setPolishNotification(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Toolbar: Chuốt Lời Thoại Tự Nhiên & Chèn Ký Hiệu Diễn Xuất */}
        <div className="flex flex-wrap items-center gap-2 mb-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
          {/* Nhóm Nút: Chuốt Lời Thoại Tự Nhiên (3 phong cách) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 mr-0.5">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              Chuốt Lời Thoại Tự Nhiên:
            </span>

            {/* 1. TỰ NHIÊN & NGẮT NGHỈ */}
            <button
              type="button"
              disabled={isPolishing}
              onClick={() => handlePolishTranscript('natural')}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50 ${
                activePolishingStyle === 'natural'
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/30'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300 hover:text-emerald-100'
              }`}
              title="Tự động thêm khoảng lặng ngắt nghỉ, lấy hơi thở <breath>, dấu ba chấm và nhịp điệu nói chuyện đời thường"
            >
              {activePolishingStyle === 'natural' ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-300" />
              ) : (
                <span>🌿</span>
              )}
              <span>TỰ NHIÊN & NGẮT NGHỈ</span>
            </button>

            {/* 2. CẢM THÁN & CẢM XÚC */}
            <button
              type="button"
              disabled={isPolishing}
              onClick={() => handlePolishTranscript('emotional')}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50 ${
                activePolishingStyle === 'emotional'
                  ? 'bg-rose-500/30 border-rose-400 text-rose-200 ring-2 ring-rose-500/30'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-300 hover:text-rose-100'
              }`}
              title="Tăng cường xúc cảm lay động, chèn tiếng ngạc nhiên <gasp>, thở dồn nén <breath>, dấu cảm thán cao trào"
            >
              {activePolishingStyle === 'emotional' ? (
                <Loader2 className="w-3 h-3 animate-spin text-rose-300" />
              ) : (
                <span>❤️</span>
              )}
              <span>CẢM THÁN & CẢM XÚC</span>
            </button>

            {/* 3. SÔI NỔI & DỒN DẬP */}
            <button
              type="button"
              disabled={isPolishing}
              onClick={() => handlePolishTranscript('energetic')}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50 ${
                activePolishingStyle === 'energetic'
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-500/30'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300 hover:text-amber-100'
              }`}
              title="Tiết tấu nhanh dồn dập, câu ngắn dứt khoát giòn giã, chèn đệm |yeah|!, tiếng cười rạng rỡ và năng lượng bùng nổ"
            >
              {activePolishingStyle === 'energetic' ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
              ) : (
                <span>⚡</span>
              )}
              <span>SÔI NỔI & DỒN DẬP</span>
            </button>

            {/* Nút Hoàn tác (nếu đã chuốt) */}
            {previousTranscript !== null && (
              <button
                type="button"
                onClick={handleUndoPolish}
                className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1"
                title="Khôi phục lại lời thoại gốc trước khi chuốt"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Hoàn tác</span>
              </button>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700 hidden xl:block" />

          {/* Nhóm Nút: Chèn Ký Hiệu Diễn Xuất (Bên cạnh hàng chữ Chuốt Lời Thoại) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-0.5">
              Chèn Ký Hiệu Diễn Xuất:
            </span>
            <button
              type="button"
              onClick={() => insertTag('<breath>')}
              className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 border border-purple-500/30 transition cursor-pointer"
              title="Chèn tiếng thở / hít hơi tự nhiên"
            >
              + &lt;breath&gt; (Thở)
            </button>
            <button
              type="button"
              onClick={() => insertTag('<laugh>')}
              className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition cursor-pointer"
              title="Chèn tiếng cười nhẹ / bật cười"
            >
              + &lt;laugh&gt; (Cười)
            </button>
            <button
              type="button"
              onClick={() => insertTag('<gasp>')}
              className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition cursor-pointer"
              title="Chèn tiếng giật mình / ngạc nhiên nghẹt thở"
            >
              + &lt;gasp&gt; (Kinh ngạc)
            </button>
            <button
              type="button"
              onClick={() => insertTag('|yeah|')}
              className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 transition cursor-pointer"
              title="Đệm giọng đồng tình tự nhiên |yeah|"
            >
              + |yeah|
            </button>
            <button
              type="button"
              onClick={() => insertTag('|mhm|')}
              className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition cursor-pointer"
              title="Đệm giọng gật gù |mhm|"
            >
              + |mhm|
            </button>
          </div>
        </div>

        <textarea
          ref={transcriptTextareaRef}
          id="transcript-textarea"
          rows={5}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={
            lockedTake
              ? `Nhập lời thoại mới đã hoàn chỉnh tại đây... AI sẽ biểu diễn với 100% chất giọng của ${lockedTake.characterName} (Take #${lockedTake.takeNumber})!`
              : "Nhập nội dung lời thoại cần đọc tại đây. Hãy để phong cách lời thoại ăn khớp nhịp nhàng với 4 phần chỉ đạo ở trên để AI tạo ra giọng đọc chân thực và giàu cảm xúc nhất..."
          }
          className={`w-full px-3.5 py-3 text-xs md:text-sm rounded-xl bg-slate-900 border focus:outline-none text-slate-100 placeholder:text-slate-500 leading-relaxed font-sans transition ${
            lockedTake
              ? 'border-amber-500/60 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
          }`}
        />

        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
          <span>
            {lockedTake
              ? `Đang áp dụng 100% mẫu giọng Take #${lockedTake.takeNumber} cho lời thoại mới này.`
              : 'Khuyên dùng: Lời thoại đồng điệu với hồ sơ nhân vật & bối cảnh sẽ đạt độ biểu cảm cao nhất.'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTranscript('')}
              className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
            >
              Xóa trắng
            </button>
          </div>
        </div>
      </div>

      {/* QUICK IMPORT 5-PART SCRIPT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    DÁN NHANH KỊCH BẢN ĐẠO DIỄN (5 PHẦN)
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      AUTO-PARSER
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dán toàn bộ prompt kịch bản gồm 5 phần (Audio Profile, The Scene, Director's Notes, Sample Context, Transcript), AI sẽ tự động phân bổ chuẩn xác vào từng ô.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5-Field Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              <span className="p-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">1. Profile</span>
              <span className="p-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">2. Scene</span>
              <span className="p-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">3. Notes</span>
              <span className="p-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">4. Context</span>
              <span className="col-span-2 sm:col-span-1 p-1 rounded bg-purple-500/25 text-purple-200 border border-purple-500/40">5. Transcript</span>
            </div>

            {/* Quick Template Preset Buttons */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Hoặc chọn mẫu thử nghiệm nhanh:</span>
              <button
                type="button"
                onClick={() => setImportText(SAMPLE_5_PART_PROMPT)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Nạp Mẫu Ví Dụ (Xe Hơi & Lời Thoại Kịch Tính)</span>
              </button>
            </div>

            {/* Textarea */}
            <div className="flex-1 min-h-[220px]">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Dán toàn bộ kịch bản tại đây...&#10;&#10;1. AUDIO PROFILE (Hồ sơ nhân vật)&#10;Vocal Type: Nam trầm ấm...&#10;&#10;2. THE SCENE (Bối cảnh & Không gian)&#10;Acoustic Environment: Thu âm trong studio...&#10;&#10;3. DIRECTOR'S NOTES (Chỉ đạo diễn xuất)&#10;Pacing: Chậm rãi...&#10;&#10;4. SAMPLE CONTEXT (Bối cảnh điểm)&#10;Background: Nhân vật ngồi trong xe...&#10;&#10;5. TRANSCRIPT (Văn bản đọc)&#10;[Thở dài nhẹ] Tôi đã nói với bạn..."
                className="w-full h-full min-h-[220px] p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-200 font-mono leading-relaxed"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setImportText('')}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                Xóa nội dung
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={!importText.trim() || isImporting}
                  onClick={() => handleApply5PartScript()}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/25 transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang phân tách...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Phân Tách & Nạp Vào Studio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
