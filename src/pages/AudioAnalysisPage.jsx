import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import AudioAnalysisContent from '../components/audio-analysis/AudioAnalysisContent';

const AudioAnalysisPage = () => {
  return (
    <DashboardLayout>
      <AudioAnalysisContent />
    </DashboardLayout>
  );
};

export default AudioAnalysisPage;