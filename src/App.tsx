import { useState, useEffect } from 'react';
import type { AppView, ModuleId, ConceptContext } from './engine/types';
import PasswordGate from './components/PasswordGate';
import ApiKeyInput from './components/ApiKeyInput';
import CsvUploader from './components/CsvUploader';
import ProcessingView from './components/ProcessingView';
import OutputSelector from './components/OutputSelector';
import SegmentDiscovery from './components/modules/SegmentDiscovery';
import PersonaBuilder from './components/modules/PersonaBuilder';
import AnglesGenerator from './components/modules/AnglesGenerator';
import HookGenerator from './components/modules/HookGenerator';
import ScriptWriter from './components/modules/ScriptWriter';
import CommentIntelligence from './components/modules/CommentIntelligence';
import ProductIntelligence from './components/modules/ProductIntelligence';
import AutopilotBriefs from './components/modules/AutopilotBriefs';
import InspirationBank from './components/modules/InspirationBank';
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
      return analysis ? (
        <OutputSelector
          analysis={analysis}
          onSelect={handleModuleSelect}
          onReset={handleReset}
        />
      ) : null;

    case 'module': {
      if (!analysis) return null;
      const moduleProps = { analysis, apiKey, resourceContext, onBack: handleBackToDashboard };

      switch (activeModule) {
        case 'segments':
          return <SegmentDiscovery {...moduleProps} />;
        case 'persona':
          return <PersonaBuilder {...moduleProps} />;
        case 'angles':
          return (
            <AnglesGenerator
              {...moduleProps}
              onWriteScript={handleWriteScriptFromAngle}
            />
          );
        case 'hooks':
          return <HookGenerator {...moduleProps} />;
        case 'script':
          return (
            <ScriptWriter
              {...moduleProps}
              conceptAngleContext={conceptAngleContext}
            />
          );
        case 'comments':
          return <CommentIntelligence {...moduleProps} />;
        case 'product-intelligence':
          return <ProductIntelligence {...moduleProps} />;
        case 'autopilot':
          return <AutopilotBriefs {...moduleProps} />;
        case 'inspiration':
          return <InspirationBank apiKey={apiKey} onBack={handleBackToDashboard} />;
        default:
          return null;
      }
    }

    default:
      return null;
  }
}
