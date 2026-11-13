let audioContext: AudioContext | null = null;
let repeatTimer: number | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const Context = window.AudioContext;
    audioContext = new Context();
  }
  return audioContext;
}

export async function enableAlarmAudio(): Promise<void> {
  const context = getAudioContext();
  if (context.state === "suspended") await context.resume();
}

export function playAlarmBeep(volume: number): void {
  if (!audioContext || audioContext.state !== "running" || volume <= 0) return;
  const now = audioContext.currentTime;
  [880, 660].forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    const start = now + index * 0.18;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.12, volume * 0.12), start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
    oscillator.connect(gain);
    gain.connect(audioContext!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.14);
  });
}

export function startAlarmRepeater(volume: number): void {
  stopAlarmRepeater();
  playAlarmBeep(volume);
  repeatTimer = window.setInterval(() => playAlarmBeep(volume), 6_000);
}

export function stopAlarmRepeater(): void {
  if (repeatTimer !== null) {
    window.clearInterval(repeatTimer);
    repeatTimer = null;
  }
}
