import React, { useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import VideoAnalysisContent from '../components/video-analysis/VideoAnalysisContent';

const VideoAnalysisPage = () => {
  useEffect(() => {
    document.title = 'Video Analysis';
  }, []);
  return (
    <DashboardLayout>
      <VideoAnalysisContent />
    </DashboardLayout>
  );
};

export default VideoAnalysisPage;