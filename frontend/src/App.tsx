import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { wagmiConfig, chains } from './config/wagmi';
import { PrivateQALandingPage } from './pages/PrivateQALandingPage';
import { PrivateQABrowsePage } from './pages/PrivateQABrowsePage';
import { PrivateQACreatePage } from './pages/PrivateQACreatePage';
import { PrivateQASessionPage } from './pages/PrivateQASessionPage';
import { PrivateQAManagePage } from './pages/PrivateQAManagePage';
import { PrivateQADashboardPage } from './pages/PrivateQADashboardPage';
import { PrivateQAMyQuestionsPage } from './pages/PrivateQAMyQuestionsPage';
import { ChainGuard } from './components/ChainGuard';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

function AppContent() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
          },
        }}
      />
      
      <ChainGuard>
        <Router>
          <Routes>
            <Route path="/" element={<PrivateQALandingPage />} />
            <Route path="/sessions" element={<PrivateQABrowsePage />} />
            <Route path="/create" element={<PrivateQACreatePage />} />
            <Route path="/session/:sessionId" element={<PrivateQASessionPage />} />
            <Route path="/manage/:sessionId" element={<PrivateQAManagePage />} />
            <Route path="/dashboard" element={<PrivateQADashboardPage />} />
            <Route path="/my-questions" element={<PrivateQAMyQuestionsPage />} />
          </Routes>
        </Router>
      </ChainGuard>
    </>
  );
}

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          chains={chains}
          modalSize="compact"
        >
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;
