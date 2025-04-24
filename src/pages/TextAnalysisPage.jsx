import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import TextAnalysisContent from '../components/text-analysis/TextAnalysisContent';

const TextAnalysisPage = () => {
  return (
    <DashboardLayout>
      <TextAnalysisContent />
    </DashboardLayout>
  );
};

export default TextAnalysisPage;