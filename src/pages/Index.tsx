import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </AppProvider>
  );
};

export default Index;
