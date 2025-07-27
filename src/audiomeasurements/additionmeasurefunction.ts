import Meyda from 'meyda';

export interface BassMeydaOpts {
  cutoffHz?: number;      // low‑band limit (default 120 Hz)
  fftSize?: number;       // 1024‑8192 (default 4096)
  hopSize?: number;       // default = fftSize / 2
  returnDb?: boolean;     // get dB instead of linear ratio
}

/**
 * Bass‑heaviness = low‑band energy (≤ cutoffHz) ÷ full‑band energy
 * Returns 0 … 1, or dB if `returnDb` is true.
 */
export async function analyzeBassHeavinessMeyda(
  file: File,
  opts: BassMeydaOpts = {},
): Promise<number> {
  const {
    cutoffHz = 120,
    fftSize  = 4096,
    hopSize  = fftSize >> 1,
    returnDb = false,
  } = opts;

  /* ---------- 1 · decode ------------------------------------------------ */
  const ab   = await file.arrayBuffer();
  const ctx  = new AudioContext();
  const buf  = await ctx.decodeAudioData(ab);
  await ctx.close();

  /* mono mix‑down */
  const mono = new Float32Array(buf.length);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < data.length; i++) mono[i] += data[i] / buf.numberOfChannels;
  }

  /* ---------- 2 · configure Meyda -------------------------------------- */
  Meyda.sampleRate = buf.sampleRate;  // tell Meyda the real SR
  Meyda.bufferSize = fftSize;
  Meyda.windowingFunction = 'hanning';  

  const binHz      = buf.sampleRate / fftSize;
  const lowBinMax  = Math.floor(cutoffHz / binHz);

  let lowEnergy = 0;
  let totalEnergy = 0;

  /* ---------- 3 · frame loop ------------------------------------------- */
  for (let pos = 0; pos + fftSize <= mono.length; pos += hopSize) {
    const frame = mono.subarray(pos, pos + fftSize);

    // <-- the static extract() call lives on Meyda, not on an analyzer
    const ps = Meyda.extract('powerSpectrum', frame) as number[] | null;
    if (!ps) continue;

    for (let bin = 0; bin < ps.length; bin++) {
      const e = ps[bin];               // already magnitude²
      totalEnergy += e;
      if (bin <= lowBinMax) lowEnergy += e;
    }
  }

  const ratio = lowEnergy / totalEnergy || 0; // Bass to full‑band energy ratio
  return returnDb ? 10 * Math.log10(ratio) : ratio; // dB conversion of linear ratio
}
