
// Types
export interface SpeechOptions {
  rate?: number;  // Speaking rate (0.1 to 10)
  pitch?: number; // Speaking pitch (0 to 2)
  volume?: number; // Speaking volume (0 to 1)
  voice?: SpeechSynthesisVoice | null; // Voice to use
  lang?: string; // Language
}

// State of speech synthesis
export interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  text: string;
  currentPosition: number;
}

// Class to handle speech synthesis
export class SpeechService {
  private static instance: SpeechService;
  private synthesis: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private state: SpeechState = {
    isSpeaking: false,
    isPaused: false,
    text: '',
    currentPosition: 0,
  };
  private listeners: ((state: SpeechState) => void)[] = [];

  private constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Initialize with default state
    this.updateState({
      isSpeaking: false,
      isPaused: false,
      text: '',
      currentPosition: 0,
    });
  }

  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  // Get available voices
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  // Get Portuguese voices (for the legal content)
  public getPortugueseVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => 
      voice.lang.includes('pt-BR') || voice.lang.includes('pt-PT')
    );
  }

  // Start speaking the text
  public speak(text: string, options?: SpeechOptions): void {
    this.stop();
    
    // Clean up the text for better narration
    const cleanedText = this.cleanTextForNarration(text);
    
    this.utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Apply options
    if (options) {
      if (options.rate !== undefined) this.utterance.rate = options.rate;
      if (options.pitch !== undefined) this.utterance.pitch = options.pitch;
      if (options.volume !== undefined) this.utterance.volume = options.volume;
      if (options.voice !== undefined) this.utterance.voice = options.voice;
      if (options.lang !== undefined) this.utterance.lang = options.lang;
    }
    
    // Handle events
    this.utterance.onstart = () => {
      this.updateState({
        isSpeaking: true,
        isPaused: false,
        text: cleanedText,
        currentPosition: 0,
      });
    };
    
    this.utterance.onpause = () => {
      this.updateState({
        ...this.state,
        isPaused: true,
      });
    };
    
    this.utterance.onresume = () => {
      this.updateState({
        ...this.state,
        isPaused: false,
      });
    };
    
    this.utterance.onend = () => {
      this.updateState({
        isSpeaking: false,
        isPaused: false,
        text: '',
        currentPosition: 0,
      });
    };
    
    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.updateState({
        isSpeaking: false,
        isPaused: false,
        text: '',
        currentPosition: 0,
      });
    };
    
    // Start speaking
    this.synthesis.speak(this.utterance);
  }

  // Pause speaking
  public pause(): void {
    if (this.state.isSpeaking && !this.state.isPaused) {
      this.synthesis.pause();
    }
  }

  // Resume speaking
  public resume(): void {
    if (this.state.isPaused) {
      this.synthesis.resume();
    }
  }

  // Stop speaking
  public stop(): void {
    this.synthesis.cancel();
    this.updateState({
      isSpeaking: false,
      isPaused: false,
      text: '',
      currentPosition: 0,
    });
  }

  // Get current state
  public getState(): SpeechState {
    return this.state;
  }

  // Subscribe to state changes
  public subscribe(listener: (state: SpeechState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Clean up text for better narration
  private cleanTextForNarration(text: string): string {
    // Replace Roman numerals with their verbal form
    text = text.replace(/\b(I{1,3})\b/g, (match) => {
      const map: Record<string, string> = { 'I': 'um', 'II': 'dois', 'III': 'três' };
      return map[match] || match;
    });
    
    // Replace common legal abbreviations
    text = text.replace(/\bart\.\b/gi, 'artigo');
    text = text.replace(/\bparágrafo único\b/gi, 'parágrafo único');
    text = text.replace(/\b§\s*(\d+)\b/g, 'parágrafo $1');
    text = text.replace(/\binc\.\b/gi, 'inciso');
    text = text.replace(/\balínea\b/gi, 'alínea');
    text = text.replace(/\bcaput\b/gi, 'caput');
    
    // Remove emojis
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    
    // Improve readability
    text = text.replace(/\s+/g, ' '); // Replace multiple spaces with a single space
    text = text.replace(/\s([.,;:!?])/g, '$1'); // Remove spaces before punctuation
    
    return text;
  }

  // Update state and notify listeners
  private updateState(newState: Partial<SpeechState>): void {
    this.state = {
      ...this.state,
      ...newState,
    };
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Export a singleton instance
export const speechService = SpeechService.getInstance();
