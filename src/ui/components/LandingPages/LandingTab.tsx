import { Box, Typography } from '@mui/material';
import React from 'react';

interface LandingTabProps {
  activeTab: string;
  tab: string;
  children: React.ReactNode;
}

const LandingTab: React.FC<LandingTabProps> = ({ activeTab, tab, children }) => {
  return <Box hidden={activeTab !== tab}>{children}</Box>;
};

export default LandingTab;
