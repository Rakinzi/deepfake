import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import VideoAnalysisContent from '../components/video-analysis/VideoAnalysisContent';

const VideoAnalysisPage = () => {
  return (
    <DashboardLayout>
      <VideoAnalysisContent />
    </DashboardLayout>
  );
};

export default VideoAnalysisPage;