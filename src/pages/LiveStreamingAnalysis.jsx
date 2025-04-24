import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import LiveStreamingAnalysisContent from '../components/live-streaming-analysis/LiveStreamingAnalysisContent';

const LiveStreamingAnalysisPage = () => {
  return (
    <DashboardLayout>
      <LiveStreamingAnalysisContent />
    </DashboardLayout>
  );
};

export default LiveStreamingAnalysisPage;