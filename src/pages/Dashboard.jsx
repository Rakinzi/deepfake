import React, { useEffect } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayouts';
import DashboardContent from '../components/dashboard/DashboardContent';

const Dashboard = () => {
  useEffect(()=>{
    document.title = 'Dashboard';
  }, [])
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
};

export default Dashboard;