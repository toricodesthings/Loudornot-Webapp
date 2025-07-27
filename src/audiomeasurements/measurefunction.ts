import {
  ebur128_integrated_mono,
  ebur128_integrated_stereo,
  ebur128_true_peak_mono,
  ebur128_true_peak_stereo,
} from 'ebur128-wasm';

/* ---------- Integrated loudness (LUFS) ---------- */
export async function analyzeLUFS(file: File): Promise<number> {
  // TEMPORARY: Add delay for testing
  await delay(TESTING_DELAY_MS);

  const arrayBuffer  = await file.arrayBuffer();
  const audioCtx     = new AudioContext();
  const audioBuffer  = await audioCtx.decodeAudioData(arrayBuffer);
  const rate         = audioBuffer.sampleRate;
  const channels     = audioBuffer.numberOfChannels;

  if (channels === 1) {
    return ebur128_integrated_mono(rate, audioBuffer.getChannelData(0));
  }

  if (channels === 2) {
    return ebur128_integrated_stereo(
      rate,
      audioBuffer.getChannelData(0),
      audioBuffer.getChannelData(1),
    );
  }

  /* Mix ≥3 channels to mono for LUFS */
  const mixed = new Float32Array(audioBuffer.length);
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += audioBuffer.getChannelData(c)[i];
    mixed[i] = sum / channels;
  }
  return ebur128_integrated_mono(rate, mixed);
}

/* ---------- True‑peak (dBTP, single programme value) ---------- */
export async function analyzeTP(file: File): Promise<number> {
  // TEMPORARY: Add delay for testing
  await delay(TESTING_DELAY_MS);

  const arrayBuffer  = await file.arrayBuffer();
  const audioCtx     = new AudioContext();
  const audioBuffer  = await audioCtx.decodeAudioData(arrayBuffer);
  const rate         = audioBuffer.sampleRate;
  const channels     = audioBuffer.numberOfChannels;

  if (channels === 1) {
    return ebur128_true_peak_mono(rate, audioBuffer.getChannelData(0));
  }

  if (channels === 2) {
    /* wasm returns a single number for stereo true peak */
    return ebur128_true_peak_stereo(
      rate,
      audioBuffer.getChannelData(0),
      audioBuffer.getChannelData(1),
    ) as number;
  }

  /* Mix ≥3 channels to mono, then measure */
  const mixed = new Float32Array(audioBuffer.length);
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += audioBuffer.getChannelData(c)[i];
    mixed[i] = sum / channels;
  }
  return ebur128_true_peak_mono(rate, mixed);
}

// TEMPORARY: Add delay for testing
const TESTING_DELAY_MS = 100;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
