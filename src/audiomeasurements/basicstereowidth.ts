export interface StereoWidthResult {
    icc: number;            // –1 … +1
  }
  
  export async function analyzeStereoWidth(
    file: File,
  ): Promise<StereoWidthResult> {
    const ab  = await file.arrayBuffer();
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(ab);
    await ctx.close();
  
    if (buf.numberOfChannels < 2) {
      return { icc: 1 };
    }
  
    const left  = buf.getChannelData(0);
    const right = buf.getChannelData(1);
    const n     = left.length;               // same length for both

    let sumL2 = 0;        // Σ L²
    let sumR2 = 0;        // Σ R²
    let dotLR = 0;        // Σ L·R
  
    for (let i = 0; i < n; i++) {
      const l = left[i];
      const r = right[i];
  
      sumL2 += l * l;
      sumR2 += r * r;
      dotLR += l * r;
    }
    
    const rmsL = Math.sqrt(sumL2 / n);
    const rmsR = Math.sqrt(sumR2 / n);
    const icc = dotLR / (n * rmsL * rmsR);
  
    return { icc: Math.max(-1, Math.min(1, icc)) }; // Clamp to [-1, 1]
  }
