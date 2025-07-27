"use client";

import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { Canvas } from '@react-three/fiber';
import styles from "../../app/page.module.css";
import Link from "next/link";
import Aurora from "./Aurora";


export default function HomeClient() {
  const [showAnimations, setShowAnimations] = useState(false);
  const [auroraOpacity, setAuroraOpacity] = useState(0);
  
  const { ref: titleRef, inView: titleInViewRaw } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  const { ref: containerRef, inView: containerInViewRaw } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  useEffect(() => {
    if (titleInViewRaw || containerInViewRaw) {
      const timer = setTimeout(() => {
        setShowAnimations(true);
        setAuroraOpacity(1);
      }, 150);
      
      return () => { clearTimeout(timer); };
    }
  }, [titleInViewRaw, containerInViewRaw]);

  return (
    <div className={styles["home-page"]}>
      <div 
        className={styles["aurora-fade-in"]}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none', 
          zIndex: 0,
          opacity: auroraOpacity,
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 85 }}
          style={{ background: 'transparent' }}
        >
          <Aurora />
        </Canvas>
      </div>

      <div className={styles["loudornot-maincontainer"]}>
        
        <div ref={titleRef} className={styles["page-title"]}>
          <h1 className={`${styles["title-gradient"]} ${styles["text-animate"]} ${showAnimations ? styles["in-view"] : ''}`}>
            Loudornot
          </h1>
          <h1 className={`${styles["title-norm"]} ${styles["text-animate"]} ${showAnimations ? styles["in-view"] : ''}`}>
            Audio Features Analyzer & Loudness Penalty Meter
          </h1>
        </div>
        <div className={styles["loudornot-panel"]}>
          <div ref={containerRef} className={styles["loudornot-container"]}>
            <Link href="/analyze" className={styles["loudornot-btnlink"]}>
              <div className={styles.hoveranimation}>
                <span className={showAnimations ? styles["in-view"] : ''}>
                  Run Analysis
                </span>
              </div>
            </Link>
            <Link href="/learn" className={styles["loudornot-btnlink"]}>
              <div className={styles["hoveranimation"]}>
                <span className={`${showAnimations ? styles["in-view"] : ''}`}>
                  Learn More
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
