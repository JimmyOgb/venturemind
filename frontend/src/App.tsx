import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { SubmitForm } from './components/SubmitForm';
import { SubmissionDetail } from './components/SubmissionDetail';
import { ReportView } from './components/ReportView';
import { EvaluationsList } from './components/EvaluationsList';
import { LookupModal } from './components/LookupModal';
import {
  WalletState,
  checkWalletConnection,
  connectWallet,
  subscribeToWalletEvents,
} from './services/wallet';

type Tab = 'home' | 'submit' | 'evaluations' | 'submission_detail' | 'report';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [selectedRepKey, setSelectedRepKey] = useState<string | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isBradbury: false,
    error: null,
  });

  // Check initial wallet connection
  const refreshWallet = useCallback(async () => {
    const state = await checkWalletConnection();
    setWallet(state);
  }, []);

  useEffect(() => {
    refreshWallet();

    // Subscribe to wallet changes (e.g. MetaMask accountsChanged / chainChanged)
    const unsubscribe = subscribeToWalletEvents(
      (accounts) => {
        if (!accounts || accounts.length === 0) {
          setWallet({
            isConnected: false,
            address: null,
            chainId: null,
            isBradbury: false,
            error: null,
          });
        } else {
          refreshWallet();
        }
      },
      () => {
        refreshWallet();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [refreshWallet]);

  const handleConnectWallet = async () => {
    try {
      const state = await connectWallet();
      setWallet(state);
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      alert(err);
    }
  };

  const handleNavigate = (tab: 'home' | 'submit' | 'evaluations') => {
    setCurrentTab(tab);
  };

  const handleSubmissionComplete = (repKey: string) => {
    setSelectedRepKey(repKey);
    setCurrentTab('submission_detail');
  };

  const handleSelectSubmission = (repKey: string) => {
    setSelectedRepKey(repKey);
    setCurrentTab('submission_detail');
  };

  const handleViewReport = (repKey: string) => {
    setSelectedRepKey(repKey);
    setCurrentTab('report');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Header */}
      <Header
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenLookup={() => setIsLookupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <Hero
            wallet={wallet}
            onConnectWallet={handleConnectWallet}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'submit' && (
          <SubmitForm
            wallet={wallet}
            onConnectWallet={handleConnectWallet}
            onSubmissionComplete={handleSubmissionComplete}
          />
        )}

        {currentTab === 'evaluations' && (
          <EvaluationsList
            wallet={wallet}
            onConnectWallet={handleConnectWallet}
            onNavigateSubmit={() => setCurrentTab('submit')}
            onSelectSubmission={handleSelectSubmission}
            onViewReport={handleViewReport}
            onOpenLookup={() => setIsLookupOpen(true)}
          />
        )}

        {currentTab === 'submission_detail' && selectedRepKey && (
          <SubmissionDetail
            repKey={selectedRepKey}
            wallet={wallet}
            onConnectWallet={handleConnectWallet}
            onViewReport={handleViewReport}
            onBack={() => setCurrentTab('evaluations')}
          />
        )}

        {currentTab === 'report' && selectedRepKey && (
          <ReportView
            repKey={selectedRepKey}
            onBack={() => setCurrentTab('evaluations')}
          />
        )}
      </main>

      {/* Lookup Modal */}
      <LookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onSelectSubmission={handleSelectSubmission}
        onViewReport={handleViewReport}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};
