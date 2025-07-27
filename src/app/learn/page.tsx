'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import styles from './learnpage.module.css';

type ViewType = 'main' | 'faqs' | 'guide';

const LearnPage = () => {
    const [currentView, setCurrentView] = useState<ViewType>('main');

    const renderMainView = () => (
            <div className={styles.buttonContainer}>
                <button 
                    className={`${styles.tabButton} ${currentView === 'faqs' ? styles.active : ''}`}
                    onClick={() => setCurrentView('faqs')}
                >
                    General FAQs
                </button>

                <Link href="/" className={`${styles.tabButton} ${styles.homeButton}`}>
                    <Home size={30} />
                </Link>

                <button 
                    className={`${styles.tabButton} ${currentView === 'guide' ? styles.active : ''}`}
                    onClick={() => setCurrentView('guide')}
                >
                    Reference Guide
                </button>
            </div>
    );

    const renderFAQsView = () => (
        <div className={styles.helpContainer}>
            <button className={styles.backButton} onClick={() => setCurrentView('main')}>
                <ArrowLeft size={20} />
            </button>
            
            <div className={styles.pageTitleContainer}>
                <h1 className={styles.pageTitle}>General FAQs</h1>
                <div className={styles.lines}></div>
            </div>

            <div className={styles.section}>
                <h1>What is this tool for?</h1>
                <p>Fundamental analysis of audio features and infographic on how much volume streaming platforms will "penalize" the given audio file. All analysis is done offline as the files are not uploaded but are digitally processed using libraries like ebur128-wasm to get an outlook on the audio data.This tool is written by me to give a better insight on how streaming platforms will affect the audio loudness through their normalization processes. This tool also aims to provide a general insight on the given audio file and how they stack up against normal reference values (roughly speaking).</p>
            </div>

            <div className={styles.section}>
                <h1>How should I make use of the information?</h1>
                <p>Up to you :) General guidance is in the guidance page.</p>
            </div>

            <div className={styles.section}>
                <h1>Will there a plugin version?</h1>
                <p>Probabaly, and with better more real time data and insights. I'm planning a utility monitoring and basic DSP all-in-one with a pretty GUI. But, this is still just an idea.</p>
            </div>

            <div className={styles.section}>
                <h1>Where are these reference numbers from?</h1>
                <ul>
                    <li>For LUFS & True Peak: <a href="https://www.itu.int/rec/R-REC-BS.1770" target="_blank" rel="noopener noreferrer">ITU-R BS.1770-4</a></li>
                    <li>For ICC & Bass Ratio: Rough reference based on many songs and from my experience as a mastering engineer.</li>
                </ul>
            </div>

            <div className={styles.section}>
                <h1>Why do streaming services penalize loud masters?</h1>
                <p>Mostly for the sake of convinience and avoiding users getting blasted by an extremely loud master following a very dynamic performance. The higher the level of your master, the more streaming service turn down to match their target loudness level, usually -14 LUFS. Going above almost has no use except for less dynamics, punch and "energy." Though, limiters, the usual final plugin of  masters aren't necessarily clean devices, therefore pushing a master louder can lead to colorization that might sound better musically. The general rule of thumb is, if it sounds good, it sounds good.</p>
            </div>
        </div>
    );

    const renderGuideView = () => (
        <div className={styles.helpContainer}>
            <button className={styles.backButton} onClick={() => setCurrentView('main')}>
                <ArrowLeft size={20} />
            </button>
            
            <div className={styles.pageTitleContainer}>
                <h1 className={styles.pageTitle}>Reference Points & Guide</h1>
                <div className={styles.lines}></div>
            </div>

            <div className={styles.section}>
                <h1>LUFS Reference Values</h1>
                <p>While there are no hard rules, streaming platforms typically normalize to -14 LUFS. Masters above this level will be turned down, while quieter masters may be turned up (depending on the platform's policy). In my personal opinion, -10 LUFS is enough for majority of tracks.</p>
                
                <table className={styles.referenceTable}>
                    <thead>
                        <tr>
                            <th>Normalization Target</th>
                            <th>Platform/Criteria</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>-10 LUFS</td>
                            <td>Spotify Loud</td>
                        </tr>
                        <tr>
                            <td>-11 LUFS</td>
                            <td>Pandora</td>
                        </tr>
                        <tr>
                            <td>-14 LUFS</td>
                            <td>Spotify, YouTube Music, Tidal, Amazon Music</td>
                        </tr>
                        <tr>
                            <td>-16 LUFS</td>
                            <td>Apple Music</td>
                        </tr>
                        <tr>
                            <td>-23 LUFS</td>
                            <td>Broadcast Standard (TV/Radio)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className={styles.section}>
                <h1>True Peak Guidelines</h1>
                <p>Keep true peaks below or equal to -1 dBTP is the sweet spot to avoid clipping on most playback systems. Some streaming platforms recommend -2 dBTP for safety. To ensure true peak is properly set, use a True Peak Limiter (majority of  limiters have this option) like Fabfilter Pro L2 set to TP mode.</p>
            </div>

            <div className={styles.section}>
                <h1>General Mastering Tips</h1>
                <p>The loudness war used to be a problem. But due to normalization, how loud a master is not as important anymore. Instead, it's better to focus on dynamics and musical balance rather than just loudness. Even with normalization, some tracks will still sound "Louder" than others. Two reasons why: A track with a lot of low end energy compared to high end is going to be sound not as loud due our ear's sensitivity to bass frequencies. A well-balanced master at -14 LUFS often sounds better than a completely crushed master at -8 LUFS after normalization. Dynamics is also very important, a song that is very loud throughout, with very little change in dynamics, even mastered to -10 LUFS for instance, will sound a lot less loud (when normalized) compared to a master that has both soft parts and loud parts. Technically, the integrated loudness will be the same, but the contrast will be perceived as way louder choruses or way quieter bridges.</p>
            </div>
        </div>
    );

    const getCurrentView = () => {
        switch (currentView) {
            case 'faqs':
                return renderFAQsView();
            case 'guide':
                return renderGuideView();
            default:
                return renderMainView();
        }
    };

    return (
        <div className={styles.container}>
            {getCurrentView()}
        </div>
    );
};

export default LearnPage;
