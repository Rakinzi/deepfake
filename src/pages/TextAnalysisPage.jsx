import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import ImageAnalysisContent from '../components/image-analysis/ImageAnalysisContent';

const TextAnalysisPage = () => {
  return (
    <DashboardLayout>
      <ImageAnalysisContent />
    </DashboardLayout>
  );
};

export default TextAnalysisPage;