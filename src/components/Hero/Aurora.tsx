"use client";

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

function WaveformMesh({ position, isTop = true, layerIndex = 0, isDark }: { position: [number, number, number], isTop?: boolean, layerIndex?: number, isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  const waveformData = useMemo(() => {
    const points = 500; 
    const geometry = new THREE.PlaneGeometry(viewport.width * 1.3, 2.5, points - 1, 2);
    
    return { geometry, points };
  }, [viewport.width]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value:0 },
        isTop: { value: isTop ? 1.0 : 0.0 },
        layerIndex: { value: layerIndex },
        viewportWidth: { value: viewport.width },
        randomSeed: { value: Math.random() * 200 },
        isDark: { value: isDark ? 1.0 : 0.0 },
      },
      vertexShader: `
        uniform float time;
        uniform float isTop;
        uniform float layerIndex;
        uniform float viewportWidth;
        uniform float randomSeed;
        varying vec2 vUv;
        varying float vWave;
        varying float vIntensity;
        varying float vSmooth;
        
        // Improved smoother noise function with better interpolation
        float smoothNoise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          // Quintic interpolation for smoother results
          f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
          
          float a = fract(sin(dot(i, vec2(12.9898,78.233))) * 43758.5453123);
          float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898,78.233))) * 43758.5453123);
          float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898,78.233))) * 43758.5453123);
          float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898,78.233))) * 43758.5453123);
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        void main() {
          vUv = uv;
          
          float layerOffset = layerIndex * 0.4;
          float timeOffset = time + randomSeed + layerOffset;
          
          // Apply opposite direction for bottom aurora
          float flowDirection = isTop > 0.5 ? 1.0 : -1.0;
          timeOffset *= flowDirection;
          
          // Smoother wave generation with reduced jaggedness
          float wave1 = sin(position.x * (1.5 + smoothNoise(vec2(randomSeed, 1.0)) * 0.3) + timeOffset * (1.5 + layerIndex * 0.1)) * (0.6 + smoothNoise(vec2(randomSeed, 2.0)) * 0.3);
          float wave2 = sin(position.x * (3.5 + smoothNoise(vec2(randomSeed, 3.0)) * 0.3) + timeOffset * (1.3 - layerIndex * 0.05)) * (0.5 + smoothNoise(vec2(randomSeed, 4.0)) * 0.25);
          float wave3 = sin(position.x * (4.0 + smoothNoise(vec2(randomSeed, 5.0)) * 0.2) + timeOffset * (2.0 + layerIndex * 0.08)) * (0.4 + smoothNoise(vec2(randomSeed, 6.0)) * 0.2);
          float wave4 = sin(position.x * (2.0 + smoothNoise(vec2(randomSeed, 7.0)) * 0.15) + timeOffset * (0.9 + layerIndex * 0.12)) * (0.65 + smoothNoise(vec2(randomSeed, 8.0)) * 0.25);
          
          // Reduced high-frequency components for smoother edges
          float highFreq1 = sin(position.x * 10.0 + timeOffset * 5.0) * 0.08 * (0.8 + sin(timeOffset * 2.0) * 0.2);
          float highFreq2 = sin(position.x * 15.0 + timeOffset * 7.5) * 0.05 * (0.8 + cos(timeOffset * 3.5) * 0.2);
          
          float combinedWave = wave1 + wave2 + wave3 + wave4 + highFreq1 + highFreq2;
          
          // Smoother beat-like pulsing
          float beatPulse = sin(timeOffset * 3.2) * 0.35 + sin(timeOffset * 5.1) * 0.2;
          combinedWave += beatPulse;
          
          // Enhanced smoothing with layer-based variation
          float smoothingFactor = 0.85 + layerIndex * 0.03;
          combinedWave *= smoothingFactor;
          
          // Scale the wave height for dramatic effect while maintaining bounds
          float waveHeight = combinedWave * (0.32 + layerIndex * 0.08);
          
          // Apply wave to Y position
          vec3 newPosition = position;
          
          // For bottom waveforms: invert the wave direction so they point upward when top points down
          if (isTop < 0.5) {
            waveHeight *= -1.0;
          }
          
          // Add the wave displacement to the Y position
          newPosition.y += waveHeight;
          
          // Scale to extend beyond viewport width
          newPosition.x = (position.x) * viewportWidth * 0.65;
          
          vWave = combinedWave;
          vIntensity = abs(combinedWave) + abs(beatPulse) * 0.4;
          vSmooth = smoothingFactor;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float isTop;
        uniform float layerIndex;
        uniform float randomSeed;
        uniform float isDark;
        varying vec2 vUv;
        varying float vWave;
        varying float vIntensity;
        varying float vSmooth;
        
        // Improved smoother noise function
        float smoothNoise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          // Quintic interpolation for smoother results
          f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
          
          float a = fract(sin(dot(i, vec2(12.9898,78.233))) * 43758.5453123);
          float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898,78.233))) * 43758.5453123);
          float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898,78.233))) * 43758.5453123);
          float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898,78.233))) * 43758.5453123);
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        void main() {
          // Create flowing gradient colors with more variation
          float flowDirection = isTop > 0.5 ? 1.0 : -1.0;
          float flowOffset = time * (0.25 + layerIndex * 0.08) * flowDirection + randomSeed;
          float colorFlow = vUv.x * 0.7 + flowOffset + vIntensity * 0.2;
          
          // Define color palettes based on theme
          vec3 darkColor1, darkColor2, darkColor3, darkColor4, darkColor5, darkColor6;
          vec3 lightColor1, lightColor2, lightColor3, lightColor4, lightColor5, lightColor6, lightColor7;
          
          // Dark mode palette: rgb(100, 149, 237), rgb(35, 193, 208), rgb(153, 72, 230), rgb(138, 123, 205), rgb(95, 147, 160), rgb(100, 149, 237)
          darkColor1 = vec3(100.0/255.0, 149.0/255.0, 237.0/255.0);
          darkColor2 = vec3(35.0/255.0, 193.0/255.0, 208.0/255.0);
          darkColor3 = vec3(153.0/255.0, 72.0/255.0, 230.0/255.0);
          darkColor4 = vec3(138.0/255.0, 123.0/255.0, 205.0/255.0);
          darkColor5 = vec3(95.0/255.0, 147.0/255.0, 160.0/255.0);
          darkColor6 = vec3(100.0/255.0, 149.0/255.0, 237.0/255.0);
          
          // Light mode palette: rgb(90, 151, 211), rgb(97, 174, 195), rgb(218, 118, 226), rgb(186, 159, 253), rgb(86, 166, 215), rgb(90, 151, 211)
          lightColor1 = vec3(90.0/255.0, 151.0/255.0, 211.0/255.0);
          lightColor2 = vec3(97.0/255.0, 174.0/255.0, 195.0/255.0);
          lightColor3 = vec3(218.0/255.0, 118.0/255.0, 226.0/255.0);
          lightColor4 = vec3(186.0/255.0, 159.0/255.0, 253.0/255.0);
          lightColor5 = vec3(86.0/255.0, 166.0/255.0, 215.0/255.0);
          lightColor7 = vec3(90.0/255.0, 151.0/255.0, 211.0/255.0);
          
          vec3 color;
          
          if (isDark > 0.5) {
            // Dark mode: use 6-color palette
            float t = mod(colorFlow, 6.0);
            if (t < 1.0) {
              color = mix(darkColor1, darkColor2, t);
            } else if (t < 2.0) {
              color = mix(darkColor2, darkColor3, t - 1.0);
            } else if (t < 3.0) {
              color = mix(darkColor3, darkColor4, t - 2.0);
            } else if (t < 4.0) {
              color = mix(darkColor4, darkColor5, t - 3.0);
            } else if (t < 5.0) {
              color = mix(darkColor5, darkColor6, t - 4.0);
            } else {
              color = mix(darkColor6, darkColor1, t - 5.0);
            }
          } else {
            // Light mode: use 7-color palette
            float t = mod(colorFlow, 7.0);
            if (t < 1.0) {
              color = mix(lightColor1, lightColor2, t);
            } else if (t < 2.0) {
              color = mix(lightColor2, lightColor3, t - 1.0);
            } else if (t < 3.0) {
              color = mix(lightColor3, lightColor4, t - 2.0);
            } else if (t < 4.0) {
              color = mix(lightColor4, lightColor5, t - 3.0);
            } else if (t < 5.0) {
              color = mix(lightColor5, lightColor6, t - 4.0);
            } else {
              color = mix(lightColor6, lightColor7, t - 5.0);
            }
          }
          
          // Enhanced intensity-based color variation for better contrast
          float intensityMod = 1.0 + vIntensity * 0.4 + sin(vIntensity * 8.0) * 0.1;
          color *= intensityMod;
          
          // Improved alpha calculation for better shadowy blend contrast
          float baseAlpha = .13 + vIntensity * 0.20;
          
          // Better edge fade with smoother corners using power function
          float edgeDistance = abs(vUv.x - 0.5) * 2.0;
          float edgeFade = 1.0 - pow(edgeDistance, 1.5);
          edgeFade = smoothstep(0.0, 1.0, edgeFade);
          
          // Enhanced vertical fade for better shadowy blending
          float verticalFade;
          if (isTop > 0.5) {
            // Top waveform: improved fade from center line downward
            verticalFade = 1.0 - pow(vUv.y, 1.8);
          } else {
            // Bottom waveform: improved fade from center line upward
            verticalFade = 1.0 - pow(1.0 - vUv.y, 1.8);
          }
          verticalFade = smoothstep(0.0, 1.0, verticalFade);
          
          // Layer-specific alpha for better depth and contrast
          float layerAlpha = 1.0 - (layerIndex * 0.12);
          
          // Create shadow contrast based on wave intensity
          float shadowContrast = 1.0 - (vIntensity * 0.2);
          
          baseAlpha *= edgeFade * verticalFade * layerAlpha * shadowContrast;
          
          // Subtle noise variation for texture without jaggedness
          float noiseVariation = smoothNoise(vUv * 8.0 + time * 0.06) * 0.03;
          baseAlpha += noiseVariation;
          
          // Enhanced final alpha with better contrast control
          float finalAlpha = baseAlpha * (0.28 + layerIndex * 0.04);
          
          gl_FragColor = vec4(color, finalAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
  }, [isTop, viewport.width, layerIndex, isDark]);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={position} geometry={waveformData.geometry} material={material} />
  );
}

export default function Aurora() {
  const { viewport } = useThree();
  const { isDark } = useTheme();
  
  // Back to 3 layers per waveform as requested
  const layers = [0, 1, 2, 3];
  
  return (
    <>
      {layers.map((layerIndex) => (
        <group key={`waveforms-${layerIndex}`}>
          {/* Top waveforms - moved further up from center */}
          <WaveformMesh 
            position={[0, viewport.height / 2 - (layerIndex * 0.08), -layerIndex * 0.12]} 
            isTop={true} 
            layerIndex={layerIndex}
            isDark={isDark}
          />
          {/* Bottom waveforms - moved up to match top aurora height */}
          <WaveformMesh 
            position={[0, -viewport.height / 2 + (layerIndex * 0.08), -layerIndex * 0.12]} 
            isTop={false} 
            layerIndex={layerIndex}
            isDark={isDark}
          />
        </group>
      ))}
    </>
  );
}