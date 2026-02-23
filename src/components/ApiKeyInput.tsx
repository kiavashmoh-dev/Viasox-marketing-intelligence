import { useState } from 'react';

interface Props {
  onSubmit: (key: string) => void;
}

export default function ApiKeyInput({ onSubmit }: Props) {
  const [key, setKey] = useState(() => sessionStorage.getItem('claude_api_key') ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('API key should start with "sk-ant-"');
      return;
    }
    sessionStorage.setItem('claude_api_key', trimmed);
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Claude API Key</h1>
          <p className="text-slate-500 mt-2">
            Enter your Anthropic API key. It will only be stored in this browser session.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Your key is sent directly to Anthropic's API via a CORS proxy. It is never stored on any server.
        </p>
      </div>
    </div>
  );
}
