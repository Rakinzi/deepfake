import React, { useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import AudioAnalysisContent from '../components/audio-analysis/AudioAnalysisContent';

const AudioAnalysisPage = () => {
  useEffect(()=>{
    document.title = 'Audio Analysis';
  }, [])
  return (
    <DashboardLayout>
      <AudioAnalysisContent />
    </DashboardLayout>
  );
};

export default AudioAnalysisPage;