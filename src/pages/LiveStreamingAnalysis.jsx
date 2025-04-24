import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import ImageAnalysisContent from '../components/image-analysis/ImageAnalysisContent';

const LiveStreamingAnalysisPage = () => {
  return (
    <DashboardLayout>
      <ImageAnalysisContent />
    </DashboardLayout>
  );
};

export default LiveStreamingAnalysisPage;