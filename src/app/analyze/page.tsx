'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the actual component with SSR disabled
const AnalyzePageContent = dynamic(() => import('./AnalyzePageContent'), {
    ssr: false,
    loading: () => <div>Loading...</div>
});

const AnalyzePage = () => {
    return <AnalyzePageContent />;
};

export default AnalyzePage;