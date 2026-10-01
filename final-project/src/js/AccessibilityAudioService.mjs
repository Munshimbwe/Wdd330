export default class AccessibilityAudioService {
  constructor() {
    // I initialize browser text-to-speech synthesis settings
    this.synth = window.speechSynthesis;
    this.isSupported = "speechSynthesis" in window;
    this.enabled = localStorage.getItem("ubumi_audio_enabled") === "true";
  }

  // I toggle global audio narration states and persist preferences
  toggleAudio() {
    this.enabled = !this.enabled;
    localStorage.setItem("ubumi_audio_enabled", this.enabled);
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }

  // I speak clinical recommendations or triage statuses aloud
  speak(text) {
    if (!this.isSupported || !this.enabled || !text) return;

    // I cancel any active utterances to prevent speech queue overlap
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // I set a slightly slower pace for clear clinical comprehension
    utterance.pitch = 1.0;

    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith("en"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }

  // I immediately stop any active audio narration playback
  stop() {
    if (this.isSupported) {
      this.synth.cancel();
    }
  }
}