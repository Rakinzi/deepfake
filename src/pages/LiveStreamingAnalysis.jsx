import React, { useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import LiveStreamingAnalysisContent from '../components/live-streaming-analysis/LiveStreamingAnalysisContent';

const LiveStreamingAnalysisPage = () => {
  useEffect(()=> {
    document.title = 'Live Streaming Analysis';
  }, [])
  return (
    <DashboardLayout>
      <LiveStreamingAnalysisContent />
    </DashboardLayout>
  );
};

export default LiveStreamingAnalysisPage;