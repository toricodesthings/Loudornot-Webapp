import React from 'react';
import Link from 'next/link';
import analyzePageStyles from './filesummary.module.css';
import restartButtonStyles from './restartButton.module.css';
import tooltipStyles from './tooltip.module.css';
import homeButtonStyles from './homeButton.module.css';

interface FileSummaryProps {
    file: File;
    lufsValue: number;
    TpValue: number;
    bassValue: number;
    iccValue: number;
    onAnalyzeAnother: () => void;
}

interface CategoryResult {
    category: string;
    color: string;
}

interface MetricConfig {
    value: number;
    label: string;
    unit: string;
    tooltip: string;
    categoryResult: CategoryResult;
    precision: number;
}

interface StreamingService {
    name: string;
    targetLufs: number;
}

// Move TOOLTIP_CONTENT outside component to avoid dependency issues
const TOOLTIP_CONTENT = {
    lufs: "Loudness Units relative to Full Scale (LUFS) measures the perceived loudness of audio content. It's the international standard for measuring loudness in broadcast and streaming and uses the same scale as decibels. Values typically range from -8 LUFS (very loud) to -30 LUFS (very quiet). But, most streaming platforms normalize audio to around -14 LUFS to ensure consistent playback levels across different tracks. Therefore, going above -14 LUFS causes tracks to be turned down in volume.",
    truePeak: "True Peak (dBTP) represents the maximum sample value that could occur after digital-to-analog conversion. Values above -1 dBTP may cause distortion on some playback systems. The suggested standard is to keep true peaks below -1 dBTP to ensure compatibility across all playback devices and leave headroom for lossy compression which increases the truepeak. Use a true peak limiter to ensure consistent true peak levels.",
    bassContent: "Bass Content Ratio measures the proportion of low-frequency energy using the cutoff of 120 Hz relative to the total energy in the track. A ratio of 0.5 means bass frequencies contain 50% of the track's energy. This metric has no exact standard but can help identify if bass might be too heavy or light for the genre.",
    stereoWidth: "Inter-Channel Correlation (ICC) quantifies the relationship between left and right channels in stereo audio. A value of 1.0 indicates mono (identical channels), 0.5-0.9 represents natural stereo width, 0.0-0.3 suggests wide stereo imaging. Negative values may indicate phase issues that could cause problems on mono playback systems and sound 'phasey' and incoherent.",
} as const;

const FileSummary: React.FC<FileSummaryProps> = ({
    file,
    lufsValue,
    TpValue,
    bassValue,
    iccValue,
    onAnalyzeAnother
}) => {
    
    // Add state for tooltip management
    const [activeTooltip, setActiveTooltip] = React.useState<string | null>(null);
    const [displayedText, setDisplayedText] = React.useState<string>('');
    const [isTyping, setIsTyping] = React.useState<boolean>(false);

    // Constants
    const COLORS = {
        veryHigh: 'rgba(var(--high-rate-misc-color-rgb), 0.8)',
        high: 'rgba(var(--attention-color-rgb), 0.8)',
        normal: 'rgba(var(--normal-color-rgb), 0.8)',
        low: 'rgba(var(--low-rate-misc-color-rgb), 0.8)'
    } as const;

    const STREAMING_SERVICES: StreamingService[] = [
        { name: 'Spotify', targetLufs: -14 },
        { name: 'Youtube', targetLufs: -14 },
        { name: 'Apple Music', targetLufs: -16 },
        { name: 'Tidal', targetLufs: -14 },
        { name: 'Amazon', targetLufs: -14 },
        { name: 'Deezer', targetLufs: -15 }
    ];

    const FLEX_CENTER_STYLE = { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
    } as const;

    // Utility functions
    const formatFileSize = (bytes: number): string => 
        `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    const getLufsCategory = (lufs: number): CategoryResult => {
        if (lufs > -8) return { category: 'Very Loud', color: COLORS.veryHigh };
        if (lufs > -10) return { category: 'Loud', color: COLORS.high };
        if (lufs > -14) return { category: 'Normal', color: COLORS.normal };
        return { category: 'Quiet', color: COLORS.low };
    };

    const getTruePeakCategory = (tp: number): CategoryResult => {
        return Number(tp.toPrecision(1)) > -1 
            ? { category: 'High', color: COLORS.high }
            : { category: 'Normal', color: COLORS.normal };
    };

    const getBassCategory = (bass: number): CategoryResult => {
        if (bass > 0.85) return { category: 'Very Bass Heavy', color: COLORS.veryHigh };
        if (bass > 0.6) return { category: 'Bass Heavy', color: COLORS.high };
        if (bass > 0.45) return { category: 'Balanced Bass', color: COLORS.normal };
        return { category: 'Light Bass', color: COLORS.low };
    };

    const getICCCategory = (icc: number): CategoryResult => {
        if (icc === 1) return { category: 'Mono', color: COLORS.high };
        if (icc > 0.9) return { category: 'Mono-like', color: COLORS.low };
        if (icc > 0.3) return { category: 'Natural Stereo', color: COLORS.normal };
        if (icc > 0) return { category: 'Wide Stereo', color: COLORS.high };
        return { category: 'Phasey', color: COLORS.veryHigh };
    };

    const calculateNormalization = (targetLufs: number): string => 
        (targetLufs - lufsValue).toFixed(2);

    const handleTooltipClick = (tooltipKey: string) => {
        setActiveTooltip(prev => prev === tooltipKey ? null : tooltipKey);
    };

    const handleCloseTooltip = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setActiveTooltip(null);
    };

    // Typing animation hook
    React.useEffect(() => {
        if (!activeTooltip) {
            setDisplayedText('');
            setIsTyping(false);
            return;
        }

        const fullText = TOOLTIP_CONTENT[activeTooltip as keyof typeof TOOLTIP_CONTENT];
        setDisplayedText('');
        setIsTyping(true);

        let currentIndex = 0;
        const typingSpeed = 4; // milliseconds per character

        const typeInterval = setInterval(() => {
            if (currentIndex < fullText.length) {
                setDisplayedText(fullText.slice(0, currentIndex + 1));
                currentIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typeInterval);
            }
        }, typingSpeed);

        return () => {
            clearInterval(typeInterval);
        };
    }, [activeTooltip]);

    // Component for detailed tooltip information
    const TooltipDetailView: React.FC = () => (
        <div className={analyzePageStyles.tooltipDetailView}>
            <p className={analyzePageStyles.tooltipDetailText}>
                {displayedText}
                {isTyping && <span className={analyzePageStyles.typingCursor}>|</span>}
            </p>
        </div>
    );

    // Component for metric display
    const MetricDisplay: React.FC<MetricConfig & { tooltipKey: string }> = ({ 
        value, 
        label, 
        unit, 
        categoryResult, 
        precision,
        tooltipKey
    }) => (
        <div className={analyzePageStyles.lufsresultContainer}>
            <span className={analyzePageStyles.values}>
                {value.toFixed(precision)}{unit && ` ${unit}`}
            </span>
            <div style={FLEX_CENTER_STYLE}>
                <span className={analyzePageStyles.subtext}>{label}</span>
                <div className={tooltipStyles.tooltipContainer}>
                    <button 
                        className={tooltipStyles.tooltipTrigger}
                        onClick={() => handleTooltipClick(tooltipKey)}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        type="button"
                    >
                        ?
                    </button>
                </div>
            </div>
            <span 
                className={analyzePageStyles.category} 
                style={{ backgroundColor: categoryResult.color }}
            >
                {categoryResult.category}
            </span>
        </div>
    );

    // Component for streaming service display
    const StreamingServiceDisplay: React.FC<StreamingService> = ({ name, targetLufs }) => (
        <div className={analyzePageStyles.service}>
            <span className={analyzePageStyles.lufsvalue}>
                {calculateNormalization(targetLufs)}
            </span>
            <span className={analyzePageStyles.subtext}>dB</span>
            <span className={analyzePageStyles.streamingservice}>{name}</span>
        </div>
    );

    // Metric configurations with tooltip keys
    const metrics: (MetricConfig & { tooltipKey: string })[] = [
        {
            value: lufsValue,
            label: 'Loudness (LUFS)',
            unit: '',
            tooltip: TOOLTIP_CONTENT.lufs,
            categoryResult: getLufsCategory(lufsValue),
            precision: 2,
            tooltipKey: 'lufs'
        },
        {
            value: TpValue,
            label: 'True Peak (dBTP)',
            unit: '',
            tooltip: TOOLTIP_CONTENT.truePeak,
            categoryResult: getTruePeakCategory(TpValue),
            precision: 1,
            tooltipKey: 'truePeak'
        },
        {
            value: bassValue,
            label: 'Bass Content Ratio',
            unit: '',
            tooltip: TOOLTIP_CONTENT.bassContent,
            categoryResult: getBassCategory(bassValue),
            precision: 1,
            tooltipKey: 'bassContent'
        },
        {
            value: iccValue,
            label: 'Inter-Channel Correlation',
            unit: '',
            tooltip: TOOLTIP_CONTENT.stereoWidth,
            categoryResult: getICCCategory(iccValue),
            precision: 2,
            tooltipKey: 'stereoWidth'
        }
    ];

    return (
        <div className={analyzePageStyles.analyzeSection}>
            <div className={analyzePageStyles.textContainer}>
                <h1 className={analyzePageStyles.title}>
                    {file.name} • {formatFileSize(file.size)}
                </h1>
            </div>

            {/* Audio Features */}
            <div className={analyzePageStyles.featureSection}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3>{activeTooltip ? 'Audio Feature Details' : 'Audio Features'}</h3>
                    {activeTooltip && (
                        <button 
                            className={analyzePageStyles.closeButton}
                            onClick={handleCloseTooltip}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            type="button"
                            aria-label="Close detailed information"
                        >
                            ×
                        </button>
                    )}
                </div>
                <div className={analyzePageStyles.lines}></div>
                {activeTooltip ? (
                    <TooltipDetailView />
                ) : (
                    <div className={analyzePageStyles.featureContainer}>
                        {metrics.map((metric, index) => (
                            <MetricDisplay key={index} {...metric} />
                        ))}
                    </div>
                )}
            </div>

            <div className={analyzePageStyles.divider}></div>

            {/* Normalization by Streaming Services */}
            <div className={analyzePageStyles.penaltySection}>
                <h3>Normalization by Streaming Services</h3>
                <div className={analyzePageStyles.lines}></div>
                <div className={analyzePageStyles.penaltyContainer}>
                    {STREAMING_SERVICES.map((service, index) => (
                        <StreamingServiceDisplay key={index} {...service} />
                    ))}
                </div>
            </div>

            <div className={analyzePageStyles.buttonContainer}>
                <div className={analyzePageStyles.buttonAligners}>
                    <button className={restartButtonStyles['cssbuttons-io-button']} onClick={onAnalyzeAnother}>
                        Analyze Another File
                        <div className={restartButtonStyles.icon}>
                            <svg
                                height="24"
                                width="24"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M0 0h24v24H0z" fill="none"></path>
                                <path
                                    d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                                    fill="currentColor"
                                ></path>
                            </svg>
                        </div>
                    </button>

                    <Link href="/">
                        <button className={homeButtonStyles.Btn}>
                            <div className={homeButtonStyles.sign}>
                                <svg viewBox="0 0 512 512">
                                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                                </svg>
                            </div>
                            <div className={homeButtonStyles.text}>Home</div>
                        </button>
                    </Link>
                </div>

                <p className={analyzePageStyles.dragDropNote}>
                    Or Drag and Drop Another Audio File
                </p>
            </div>
        </div>
    );
};

export default FileSummary;
