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
import IntelligenceReport from './components/modules/IntelligenceReport';
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
    setView('upload');
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

  // Transition from processing → upload on error
  useEffect(() => {
    if (view === 'processing' && analysisError) {
      setView('upload');
    }
  }, [view, analysisError]);

  switch (view) {
    case 'auth':
      return <PasswordGate onSuccess={handleAuthSuccess} />;

    case 'apikey':
      return <ApiKeyInput onSubmit={handleApiKey} />;

    case 'upload':
      return <CsvUploader onFiles={handleFiles} error={analysisError} />;

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
        case 'report':
          return <IntelligenceReport {...moduleProps} />;
        default:
          return null;
      }
    }

    default:
      return null;
  }
}
