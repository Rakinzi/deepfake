import React, { useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import ImageAnalysisContent from '../components/image-analysis/ImageAnalysisContent';

const ImageAnalysisPage = () => {
  useEffect(()=> {
    document.title = 'Image Analysis';
  }, [])
  return (
    <DashboardLayout>
      <ImageAnalysisContent />
    </DashboardLayout>
  );
};

export default ImageAnalysisPage;