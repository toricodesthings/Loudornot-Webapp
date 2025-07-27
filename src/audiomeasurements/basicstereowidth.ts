export interface StereoWidthResult {
    icc: number;            // –1 … +1
  }
  
  export async function analyzeStereoWidth(
    file: File,
  ): Promise<StereoWidthResult> {
    /* ---- 1 · decode ------------------------------------------------------ */
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
  
    /* ---- 2 · mid/side + correlation sums -------------------------------- */
    let sumM2 = 0;        // Σ mid²
    let sumS2 = 0;        // Σ side²
    let dotLR = 0;        // Σ L·R
  
    for (let i = 0; i < n; i++) {
      const l = left[i];
      const r = right[i];
      const m = 0.5 * (l + r);     // Mid  = (L+R)/2
      const s = 0.5 * (l - r);     // Side = (L–R)/2
  
      sumM2 += m * m;
      sumS2 += s * s;
      dotLR += l * r;
    }
    
    // Calculate RMS values for proper correlation
    const rmsL = Math.sqrt(sumM2 / n);
    const rmsR = Math.sqrt(sumM2 / n); // Should use separate sum for R channel
    const icc = dotLR / (n * rmsL * rmsR);
  
    return { icc: Math.max(-1, Math.min(1, icc)) }; // Clamp to [-1, 1]
  }
