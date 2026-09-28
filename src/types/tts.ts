export interface AudioProfile {
  name: string;
  role: string;
  background: string;
}

export interface TheScene {
  title: string;
  description: string;
}

export interface DirectorsNotes {
  style: string;
  dynamics: string;
  pace: string;
  accent: string;
  customNotes: string;
}

export interface NuanceVariant {
  id: number;
  name: string;
  vietnameseTitle: string;
  tagline: string;
  description: string;
  promptModifier: string;
  color: string;
  badgeBg: string;
  iconName: string;
  defaultSpeed: number;
}

export interface DirectorPreset {
  id: string;
  title: string;
  category: string;
  audioProfile: AudioProfile;
  scene: TheScene;
  directorsNotes: DirectorsNotes;
  sampleContext: string;
  transcript: string;
  suggestedVoice: string;
  suggestedSpeed: number;
  suggestedNuanceId: number;
}

export interface TakeRecord {
  id: string;
  takeNumber: number;
  timestamp: string;
  audioBase64: string;
  mimeType: string;
  audioUrl?: string;
  duration?: number;
  characterName: string;
  characterRole: string;
  sceneTitle: string;
  nuanceName: string;
  nuanceId: number;
  speed: number;
  voiceName: string;
  transcript: string;
  sourceType?: 'manual' | 'mp3-analysis' | 'locked-voice';
  originalFileName?: string;
  analysisSummary?: string;
  lockedFromTakeNumber?: number;
  lockedCharacterName?: string;
  fullData: {
    audioProfile: AudioProfile;
    scene: TheScene;
    directorsNotes: DirectorsNotes;
    sampleContext: string;
    transcript: string;
  };
}
