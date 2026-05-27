import { useState, useEffect } from 'react';
import type { AppView, ModuleId, ConceptContext } from './engine/types';
import PasswordGate from './components/PasswordGate';
import ApiKeyInput from './components/ApiKeyInput';
import CsvUploader from './components/CsvUploader';
import ProcessingView from './components/ProcessingView';
import AppShell from './components/AppShell';
import Home from './components/Home';
import SegmentDiscovery from './components/modules/SegmentDiscovery';
import CustomerReviews from './components/modules/CustomerReviews';
import FactoryTour from './components/modules/FactoryTour';
import PersonaBuilder from './components/modules/PersonaBuilder';
import AnglesGenerator from './components/modules/AnglesGenerator';
import HookGenerator from './components/modules/HookGenerator';
import ScriptWriter from './components/modules/ScriptWriter';
import CommentIntelligence from './components/modules/CommentIntelligence';
import ProductIntelligence from './components/modules/ProductIntelligence';
import AutopilotBriefs from './components/modules/AutopilotBriefs';
import InspirationBank from './components/modules/InspirationBank';
import MemoryVault from './components/modules/MemoryVault';
import { useAnalysis } from './hooks/useAnalysis';

export default function App() {
  const [view, setView] = useState<AppView>('auth');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('claude_api_key') ?? '');
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [conceptAngleContext, setConceptAngleContext] = useState<ConceptContext | null>(null);
  const { analysis, resourceContext, progress, error: analysisError, processFiles } = useAnalysis();

  const handleAuthSuccess = () => setView('apikey');

  const handleApiKey = (key: string) => {
    setApiKey(key);
    // If embedded review data is already loaded, skip straight to dashboard
    if (analysis) {
      setView('dashboard');
    } else {
      setView('upload');
    }
  };

  const handleFiles = (csvFiles: File[], resourceFiles: File[]) => {
    setView('processing');
    processFiles(csvFiles, resourceFiles);
  };

  const handleModuleSelect = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
    setView('module');
  };

  const handleBackToDashboard = () => {
    setActiveModule(null);
    setConceptAngleContext(null);
    setView('dashboard');
  };

  const handleWriteScriptFromAngle = (context: ConceptContext) => {
    setConceptAngleContext(context);
    setActiveModule('script');
  };

  const handleReset = () => {
    setView('upload');
  };

  // Transition from processing → dashboard when analysis completes
  useEffect(() => {
    if (view === 'processing' && progress?.stage === 'complete' && analysis) {
      const timer = setTimeout(() => setView('dashboard'), 500);
      return () => clearTimeout(timer);
    }
  }, [view, progress?.stage, analysis]);

  // Derive the effective view: if processing failed with an error, show upload immediately
  // (computed during render so we don't need a setState-in-effect cascade).
  const effectiveView: AppView = view === 'processing' && analysisError ? 'upload' : view;

  switch (effectiveView) {
    case 'auth':
      return <PasswordGate onSuccess={handleAuthSuccess} />;

    case 'apikey':
      return <ApiKeyInput onSubmit={handleApiKey} />;

    case 'upload':
      return (
        <CsvUploader
          onFiles={handleFiles}
          error={analysisError}
          onBack={analysis ? handleBackToDashboard : undefined}
        />
      );

    case 'processing':
      return progress ? (
        <ProcessingView progress={progress} />
      ) : (
        <ProcessingView progress={{ stage: 'organizing', currentProduct: '', percent: 0 }} />
      );

    case 'dashboard':
    case 'module': {
      if (!analysis) return null;
      // The sidebar persists across both Home (dashboard) and any module.
      // `activeModule` drives both the sidebar's highlight AND which body
      // component is rendered in the main pane. `null` = show Home.
      const handleSidebarNav = (target: ModuleId | 'home') => {
        if (target === 'home') {
          handleBackToDashboard();
        } else {
          handleModuleSelect(target);
        }
      };
      const moduleProps = { analysis, apiKey, resourceContext, onBack: handleBackToDashboard };
      const body =
        activeModule === null ? (
          <Home analysis={analysis} onNavigate={handleModuleSelect} />
        ) : activeModule === 'segments' ? (
          <SegmentDiscovery {...moduleProps} />
        ) : activeModule === 'persona' ? (
          <PersonaBuilder {...moduleProps} />
        ) : activeModule === 'angles' ? (
          <AnglesGenerator
            {...moduleProps}
            onWriteScript={handleWriteScriptFromAngle}
          />
        ) : activeModule === 'hooks' ? (
          <HookGenerator {...moduleProps} />
        ) : activeModule === 'script' ? (
          <ScriptWriter
            {...moduleProps}
            conceptAngleContext={conceptAngleContext}
          />
        ) : activeModule === 'comments' ? (
          <CommentIntelligence {...moduleProps} />
        ) : activeModule === 'product-intelligence' ? (
          <ProductIntelligence {...moduleProps} />
        ) : activeModule === 'autopilot' ? (
          <AutopilotBriefs {...moduleProps} />
        ) : activeModule === 'inspiration' ? (
          <InspirationBank apiKey={apiKey} onBack={handleBackToDashboard} />
        ) : activeModule === 'memory-vault' ? (
          <MemoryVault onBack={handleBackToDashboard} />
        ) : activeModule === 'customer-reviews' ? (
          <CustomerReviews {...moduleProps} />
        ) : activeModule === 'factory-tour' ? (
          <FactoryTour onBack={handleBackToDashboard} onOpenFactory={() => handleModuleSelect('autopilot')} />
        ) : null;

      return (
        <AppShell
          activeModule={activeModule}
          onNavigate={handleSidebarNav}
          onResetData={handleReset}
        >
          {body}
        </AppShell>
      );
    }

    default:
      return null;
  }
}
