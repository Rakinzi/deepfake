import React, { useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import TextAnalysisContent from '../components/text-analysis/TextAnalysisContent';

const TextAnalysisPage = () => {
  useEffect(()=> {
    document.title = 'Text Analysis';
  }, []);
  return (
    <DashboardLayout>
      <TextAnalysisContent />
    </DashboardLayout>
  );
};

export default TextAnalysisPage;