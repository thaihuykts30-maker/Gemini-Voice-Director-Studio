/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DirectorColumn } from './components/DirectorColumn';
import { StudioMonitorColumn } from './components/StudioMonitorColumn';
import { HistorySection } from './components/HistorySection';
import { AiDirectorModal } from './components/AiDirectorModal';
import { GuideModal } from './components/GuideModal';
import { Mp3AnalysisModal } from './components/Mp3AnalysisModal';
import { DIRECTOR_PRESETS, NUANCE_VARIANTS } from './data/nuances';
import {
  AudioProfile,
  TheScene,
  DirectorsNotes,
  DirectorPreset,
  TakeRecord,
} from './types/tts';

export default function App() {
  // Preset defaults to Jaz R. (The classic Morning Hype from official guide)
  const defaultPreset = DIRECTOR_PRESETS[0];

  // Column 1: 5 Core Elements
  const [audioProfile, setAudioProfile] = useState<AudioProfile>(defaultPreset.audioProfile);
  const [scene, setScene] = useState<TheScene>(defaultPreset.scene);
  const [directorsNotes, setDirectorsNotes] = useState<DirectorsNotes>(defaultPreset.directorsNotes);
  const [sampleContext, setSampleContext] = useState<string>(defaultPreset.sampleContext);
  const [transcript, setTranscript] = useState<string>(defaultPreset.transcript);

  // Column 2: Studio Monitor Take Settings
  const [speed, setSpeed] = useState<number>(defaultPreset.suggestedSpeed);
  const [selectedNuanceId, setSelectedNuanceId] = useState<number>(defaultPreset.suggestedNuanceId);
  const [selectedVoice, setSelectedVoice] = useState<string>(defaultPreset.suggestedVoice);

  // Take Management & History
  const [takes, setTakes] = useState<TakeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_studio_takes');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load takes from localStorage', e);
    }
    return [];
  });

  const [currentTake, setCurrentTake] = useState<TakeRecord | null>(null);
  const [lockedTake, setLockedTake] = useState<TakeRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlayingTakeId, setActivePlayingTakeId] = useState<string | null>(null);
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isMp3ModalOpen, setIsMp3ModalOpen] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Sync takes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gemini_studio_takes', JSON.stringify(takes));
    } catch (e) {
      console.warn('Could not save takes to storage:', e);
    }
  }, [takes]);

  // Handle Preset selection
  const handleSelectPreset = (preset: DirectorPreset) => {
    setLockedTake(null);
    setAudioProfile(preset.audioProfile);
    setScene(preset.scene);
    setDirectorsNotes(preset.directorsNotes);
    setSampleContext(preset.sampleContext);
    setTranscript(preset.transcript);
    setSpeed(preset.suggestedSpeed);
    setSelectedNuanceId(preset.suggestedNuanceId);
    setSelectedVoice(preset.suggestedVoice);
    showToast(`Đã nạp kịch bản: "${preset.title}"`, 'success');
  };

  // Handle AI Auto-composed script
  const handleApplyGeneratedScript = (data: {
    audioProfile: AudioProfile;
    scene: TheScene;
    directorsNotes: DirectorsNotes;
    sampleContext: string;
    transcript: string;
  }) => {
    setAudioProfile(data.audioProfile);
    setScene(data.scene);
    setDirectorsNotes(data.directorsNotes);
    setSampleContext(data.sampleContext);
    setTranscript(data.transcript);
    showToast('AI Gemini đã tạo kịch bản 5 phần hoàn chỉnh!', 'success');
  };

  // Handle MP3 Analysis and Reproduction Completion
  const handleAnalysisAndReproduceComplete = (result: {
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
  }) => {
    // 1. Fill Column 1 with the 5 analyzed components (100% match)
    // Sections 1-4 are purely directorial controls and never read aloud.
    setAudioProfile(result.decomposedData.audioProfile);
    setScene(result.decomposedData.scene);
    setDirectorsNotes(result.decomposedData.directorsNotes);
    setSampleContext(result.decomposedData.sampleContext);

    // Section 5 is strictly isolated for speech generation (remove any accidental leaked headers)
    let cleanTranscript = (result.decomposedData.transcript || '').trim();
    cleanTranscript = cleanTranscript
      .replace(/^(?:5\.\s*)?(?:TRANSCRIPT|Văn\s*bản\s*đọc|Lời\s*thoại)[^:\n]*[:\n-]\s*/i, '')
      .replace(/^["'“”«»]+/g, '')
      .replace(/["'“”«»]+$/g, '')
      .trim();

    setTranscript(cleanTranscript);

    // 2. Adjust Studio Monitor parameters
    setSpeed(result.decomposedData.suggestedSpeed || 1.0);
    setSelectedNuanceId(result.decomposedData.suggestedNuanceId || 1);
    setSelectedVoice(result.decomposedData.suggestedVoice || 'Puck');

    // 3. Update current take and add straight into "Danh Sách Lịch Sử Giọng Đã Tạo"
    const cleanedTake: TakeRecord = {
      ...result.newTake,
      transcript: cleanTranscript,
    };
    setCurrentTake(cleanedTake);
    setTakes((prev) => [cleanedTake, ...prev]);

    showToast(
      `Đã nạp vào Studio! Giọng đọc Take #${cleanedTake.takeNumber} CHỈ đọc Lời Thoại (Mục 5). 4 mục còn lại dùng định hình diễn xuất & âm học.`,
      'success'
    );
  };

  // Perform TTS Generation
  const handlePerformTTS = async () => {
    if (!transcript.trim()) {
      showToast('Vui lòng nhập văn bản Transcript trước khi biểu diễn!', 'error');
      return;
    }

    setIsGenerating(true);
    const activeNuance =
      NUANCE_VARIANTS.find((n) => n.id === selectedNuanceId) || NUANCE_VARIANTS[0];

    const nextTakeNumber = takes.length + 1;

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioProfile,
          scene,
          directorsNotes,
          sampleContext,
          transcript,
          voiceName: selectedVoice,
          speed,
          nuanceName: activeNuance.name,
          nuancePromptModifier: activeNuance.promptModifier,
          takeNumber: nextTakeNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        let errorMsg = data.error || 'Lỗi sinh giọng nói TTS từ server.';
        try {
          const jsonMatch = errorMsg.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed?.error?.message) {
              errorMsg = parsed.error.message;
            }
          }
        } catch {
          // ignore
        }
        if (errorMsg.includes('high demand') || errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE')) {
          errorMsg = 'Máy chủ giọng nói đang quá tải tạm thời (503). Vui lòng bấm thử lại sau vài giây.';
        } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          errorMsg = 'Hạn mức xử lý tạm thời đạt đỉnh (429). Hệ thống đang điều phối lại tài nguyên, vui lòng thử lại sau giây lát.';
        }
        throw new Error(errorMsg);
      }

      const newTake: TakeRecord = {
        id: `take-${Date.now()}`,
        takeNumber: nextTakeNumber,
        timestamp: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        characterName: audioProfile.name || 'Voice Talent',
        characterRole: audioProfile.role || 'Performer',
        sceneTitle: scene.title || 'Studio',
        nuanceName: activeNuance.name,
        nuanceId: activeNuance.id,
        speed,
        voiceName: selectedVoice,
        transcript,
        sourceType: lockedTake ? 'locked-voice' : 'manual',
        lockedFromTakeNumber: lockedTake?.takeNumber,
        lockedCharacterName: lockedTake?.characterName,
        fullData: {
          audioProfile: { ...audioProfile },
          scene: { ...scene },
          directorsNotes: { ...directorsNotes },
          sampleContext,
          transcript,
        },
      };

      setCurrentTake(newTake);
      setTakes((prev) => [newTake, ...prev]);
      if (lockedTake) {
        showToast(
          `Xuất bản thu Take #${nextTakeNumber} áp dụng 100% mẫu giọng khóa từ Take #${lockedTake.takeNumber} (${lockedTake.characterName}) thành công!`,
          'success'
        );
      } else {
        showToast(`Thu âm thành công: Take #${nextTakeNumber} (${activeNuance.name})!`, 'success');
      }
    } catch (err: any) {
      console.warn('TTS execution notice:', err?.message || err);
      showToast(err.message || 'Không thể sinh giọng nói. Vui lòng thử lại.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Lock 100% Voice Model from selected take in history
  const handleLockVoiceTake = (take: TakeRecord) => {
    setLockedTake(take);

    // Apply 100% of the take's 4 core directorial elements
    if (take.fullData) {
      setAudioProfile(take.fullData.audioProfile);
      setScene(take.fullData.scene);
      setDirectorsNotes(take.fullData.directorsNotes);
      setSampleContext(take.fullData.sampleContext);
    }
    setSelectedVoice(take.voiceName);
    setSpeed(take.speed);
    setSelectedNuanceId(take.nuanceId);

    // Smooth scroll down to Section 5: Transcript and focus the textarea
    setTimeout(() => {
      const el = document.getElementById('transcript-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const ta = document.getElementById('transcript-textarea') as HTMLTextAreaElement | null;
      if (ta) {
        ta.focus();
        ta.select();
      }
    }, 150);

    showToast(
      `🔒 ĐÃ KHÓA 100% MẪU GIỌNG TAKE #${take.takeNumber} (${take.characterName})! Mời bạn nhập lời thoại mới vào mục TRANSCRIPT.`,
      'success'
    );
  };

  const handleUnlockVoiceTake = () => {
    setLockedTake(null);
    showToast('Đã hủy khóa mẫu giọng. Bạn có thể tự do chỉnh sửa kịch bản và đạo diễn.', 'info');
  };

  // Restore previous take to Studio Column 1 & Column 2
  const handleRestoreTake = (take: TakeRecord) => {
    if (take.fullData) {
      setAudioProfile(take.fullData.audioProfile);
      setScene(take.fullData.scene);
      setDirectorsNotes(take.fullData.directorsNotes);
      setSampleContext(take.fullData.sampleContext);
      setTranscript(take.fullData.transcript);
    }
    setSpeed(take.speed);
    setSelectedNuanceId(take.nuanceId);
    setSelectedVoice(take.voiceName);
    setCurrentTake(take);
    showToast(`Đã khôi phục Take #${take.takeNumber} vào bàn làm việc Studio!`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Play Take from History
  const handlePlayTake = (take: TakeRecord) => {
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
    }

    const audio = new Audio(`data:${take.mimeType || 'audio/wav'};base64,${take.audioBase64}`);
    globalAudioRef.current = audio;
    setActivePlayingTakeId(take.id);

    audio.play().catch((e) => console.error('Play error', e));

    audio.onended = () => {
      setActivePlayingTakeId(null);
    };
  };

  const handleStopTake = () => {
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
      setActivePlayingTakeId(null);
    }
  };

  const handleDeleteTake = (id: string) => {
    if (activePlayingTakeId === id) {
      handleStopTake();
    }
    if (lockedTake?.id === id) {
      setLockedTake(null);
    }
    setTakes((prev) => prev.filter((t) => t.id !== id));
    if (currentTake?.id === id) {
      setCurrentTake(null);
    }
    showToast('Đã xóa bản thu.', 'info');
  };

  const handleClearAllTakes = () => {
    handleStopTake();
    setLockedTake(null);
    setTakes([]);
    setCurrentTake(null);
    showToast('Đã xóa toàn bộ lịch sử bản thu thành công.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 transition-all border animate-in slide-in-from-bottom-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950 border-rose-500/50 text-rose-200'
              : 'bg-slate-900 border-slate-700 text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onSelectPreset={handleSelectPreset}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenMp3Modal={() => setIsMp3ModalOpen(true)}
        currentTakeCount={takes.length}
      />

      {/* Main Studio Body: 2 Columns */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 mt-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT 1: 5 PHẦN ĐẠO DIỄN (7 cols on lg) */}
          <div className="lg:col-span-7">
            <DirectorColumn
              audioProfile={audioProfile}
              setAudioProfile={setAudioProfile}
              scene={scene}
              setScene={setScene}
              directorsNotes={directorsNotes}
              setDirectorsNotes={setDirectorsNotes}
              sampleContext={sampleContext}
              setSampleContext={setSampleContext}
              transcript={transcript}
              setTranscript={setTranscript}
              lockedTake={lockedTake}
              onUnlockVoice={handleUnlockVoiceTake}
            />
          </div>

          {/* CỘT 2: STUDIO MONITOR TAKE (5 cols on lg) */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <StudioMonitorColumn
              speed={speed}
              setSpeed={setSpeed}
              selectedNuanceId={selectedNuanceId}
              setSelectedNuanceId={setSelectedNuanceId}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              isGenerating={isGenerating}
              onPerformTTS={handlePerformTTS}
              onOpenMp3Modal={() => setIsMp3ModalOpen(true)}
              currentTake={currentTake}
              takeCount={takes.length}
              hasTranscript={Boolean(transcript.trim())}
              lockedTake={lockedTake}
              onUnlockVoice={handleUnlockVoiceTake}
            />
          </div>
        </div>

        {/* PHẦN DƯỚI CÙNG: DANH SÁCH LỊCH SỬ GIỌNG ĐÃ TẠO */}
        <HistorySection
          takes={takes}
          activePlayingTakeId={activePlayingTakeId}
          lockedTakeId={lockedTake?.id || null}
          onPlayTake={handlePlayTake}
          onStopTake={handleStopTake}
          onRestoreTake={handleRestoreTake}
          onDeleteTake={handleDeleteTake}
          onClearAllTakes={handleClearAllTakes}
          onLockVoiceTake={handleLockVoiceTake}
          onUnlockVoiceTake={handleUnlockVoiceTake}
        />
      </main>

      {/* Modals */}
      <Mp3AnalysisModal
        isOpen={isMp3ModalOpen}
        onClose={() => setIsMp3ModalOpen(false)}
        onAnalysisAndReproduceComplete={handleAnalysisAndReproduceComplete}
        nextTakeNumber={takes.length + 1}
      />

      <AiDirectorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedScript={handleApplyGeneratedScript}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
