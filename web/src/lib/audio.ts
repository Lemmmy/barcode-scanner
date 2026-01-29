const BEEP_FREQUENCY = 1720;
const BEEP_DURATION = 0.2;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioContextConstructor();
  }
  return audioContext;
}

export function playBeep(): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = BEEP_FREQUENCY;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + BEEP_DURATION);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + BEEP_DURATION);
  } catch (error) {
    console.error("Failed to play beep:", error);
  }
}
