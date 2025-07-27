'use client';

import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './analyze.module.css';
import FileUploader from './FileUploader';
import Loading from './Loading';
import FileSummary from './FileSummary';
import ErrorDisplay from './ErrorDisplay';
import { analyzeLUFS, analyzeTP } from '../../audiomeasurements/measurefunction';
import { analyzeBassHeavinessMeyda } from '../../audiomeasurements/additionmeasurefunction';
import { analyzeStereoWidth } from '../../audiomeasurements/basicstereowidth';

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

    // Analyze LUFS for the given file
    const analyzeFile = async (selectedFile: File) => {
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

    const {
        getRootProps,
        getInputProps,
        isDragActive
    } = useDropzone({
        onDrop,
        accept: {
            'audio/*': []
        },
        noClick: true,
        multiple: false,
        maxSize: 500 * 1024 * 1024 // 500MB
    });

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
                maxFilesCount={1}
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

export default AnalyzePage;