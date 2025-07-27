'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from './analyze.module.css';
import FileUploader from './FileUploader';
import Loading from './Loading';
import FileSummary from './FileSummary';
import ErrorDisplay from './ErrorDisplay';

// Disable SSR for this component
export const runtime = 'edge'

// Dynamic imports for audio analysis functions to prevent SSR issues
const useAudioAnalysis = () => {
    const [analyzeLUFS, setAnalyzeLUFS] = useState<any>(null);
    const [analyzeTP, setAnalyzeTP] = useState<any>(null);
    const [analyzeBassHeavinessMeyda, setAnalyzeBassHeavinessMeyda] = useState<any>(null);
    const [analyzeStereoWidth, setAnalyzeStereoWidth] = useState<any>(null);

    React.useEffect(() => {
        // Dynamic imports to prevent SSR issues
        const loadAnalysisFunctions = async () => {
            try {
                const [lufsModule, tpModule, bassModule, stereoModule] = await Promise.all([
                    import('../../audiomeasurements/measurefunction'),
                    import('../../audiomeasurements/measurefunction'),
                    import('../../audiomeasurements/additionmeasurefunction'),
                    import('../../audiomeasurements/basicstereowidth')
                ]);

                setAnalyzeLUFS(() => lufsModule.analyzeLUFS);
                setAnalyzeTP(() => tpModule.analyzeTP);
                setAnalyzeBassHeavinessMeyda(() => bassModule.analyzeBassHeavinessMeyda);
                setAnalyzeStereoWidth(() => stereoModule.analyzeStereoWidth);
            } catch (error) {
                console.error('Failed to load analysis functions:', error);
            }
        };

        loadAnalysisFunctions();
    }, []);

    return { analyzeLUFS, analyzeTP, analyzeBassHeavinessMeyda, analyzeStereoWidth };
};

const AnalyzePage = () => {
    // File management state
    const [file, setFile] = useState<File | null>(null);
    const [lufsValue, setLufsValue] = useState<number | null>(null);
    const [tpValue, setTpValue] = useState<number | null>(null);
    const [bassValue, setBassValue] = useState<number | null>(null);
    const [iccValue, setIccValue] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { analyzeLUFS, analyzeTP, analyzeBassHeavinessMeyda, analyzeStereoWidth } = useAudioAnalysis();

    // Analyze LUFS for the given file
    const analyzeFile = async (selectedFile: File) => {
        if (!analyzeLUFS || !analyzeTP || !analyzeBassHeavinessMeyda || !analyzeStereoWidth) {
            setError('Audio analysis tools are still loading. Please try again.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setLufsValue(null);
        setTpValue(null);
        setBassValue(null);
        setIccValue(null);
        try {
            const result = await analyzeLUFS(selectedFile);
            setLufsValue(result);

            const tpResult = await analyzeTP(selectedFile);
            setTpValue(tpResult);

            const bassResult = await analyzeBassHeavinessMeyda(selectedFile);
            setBassValue(bassResult);

            const stereoResult = await analyzeStereoWidth(selectedFile);
            setIccValue(stereoResult.icc);

        } catch (err) {
            setError('Failed to analyze audio file. Please try again.');
            console.error('Analysis error:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Reset to initial state for analyzing another file
    const handleAnalyzeAnother = () => {
        setFile(null);
        setLufsValue(null);
        setTpValue(null);
        setBassValue(null);
        setIccValue(null);
        setError(null);
        setIsAnalyzing(false);
    };

    // Drag and drop configuration
    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0]; // Only take the first file
            setFile(selectedFile);
            analyzeFile(selectedFile);
        }
    };

    // Dynamic import for dropzone to prevent SSR issues
    const [useDropzone, setUseDropzone] = useState<any>(null);

    React.useEffect(() => {
        const loadDropzone = async () => {
            try {
                const dropzoneModule = await import('react-dropzone');
                setUseDropzone(() => dropzoneModule.useDropzone);
            } catch (error) {
                console.error('Failed to load dropzone:', error);
            }
        };
        loadDropzone();
    }, []);

    // Configure dropzone only when available
    const dropzoneConfig = useDropzone ? useDropzone({
        onDrop,
        accept: {
            'audio/*': []
        },
        noClick: true,
        multiple: false,
        maxSize: 500 * 1024 * 1024 // 500MB
    }) : { getRootProps: () => ({}), getInputProps: () => ({}), isDragActive: false };

    const {
        getRootProps,
        getInputProps,
        isDragActive
    } = dropzoneConfig;

    // Handle file selection from button
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0]; // Only take the first file
            setFile(selectedFile);
            analyzeFile(selectedFile);
        }
    };

    // Handle button click to open file input dialog
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Determine which component to render
    const renderContent = () => {
        if (isAnalyzing) {
            return <Loading />;
        }

        if (error) {
            return <ErrorDisplay onTryAgain={handleAnalyzeAnother} />;
        }
        
        if (file && lufsValue !== null && tpValue !== null && bassValue !== null && iccValue !== null) {
            return (
                <FileSummary
                    file={file}
                    lufsValue={lufsValue}
                    TpValue={tpValue}
                    bassValue={bassValue}
                    iccValue={iccValue}
                    onAnalyzeAnother={handleAnalyzeAnother}
                />
            );
        }

        return (
            <FileUploader
                isDragging={isDragActive}
                filesExist={file !== null}
                fileInputRef={fileInputRef}
                maxFileSize={[500]}
                availableFormats={[['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']]}
                onButtonClick={handleButtonClick}
                uploaderType="audio"
                noteLabels={['Audio']}
            />
        );
    };

    return (
        <div className={styles.container}>
            <div
                {...getRootProps({
                    className: `${styles.uploadContainer} ${styles.dashed} ${isDragActive ? styles.dragging : ''} ${error ? styles.error : ''}`
                })}
            >
                {isDragActive && (
                    <div className={styles.dropOverlay}>
                        <p>Drop Audio File Here</p>
                    </div>
                )}

                {/* Hidden input for drag-and-drop */}
                <input {...getInputProps()} style={{ display: 'none' }} />
                
                {/* Manual file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="audio/*"
                    style={{ display: 'none' }}
                />

                {renderContent()}
            </div>
        </div>
    );
};

// Export with no SSR
export default dynamic(() => Promise.resolve(AnalyzePage), {
    ssr: false,
    loading: () => <Loading />
});