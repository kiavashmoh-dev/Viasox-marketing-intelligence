import { useState, useCallback, useRef } from 'react';
import { sendMessage } from '../api/claude';

export function useClaudeApi(apiKey: string) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (system: string, userMessage: string, maxTokens = 4096, model?: string) => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const text = await sendMessage(
          system,
          userMessage,
          apiKey,
          maxTokens,
          model,
          controller.signal,
        );
        // Only update state if this request wasn't cancelled
        if (!controller.signal.aborted) {
          setResult(text);
          return text;
        }
        return null;
      } catch (err) {
        if (controller.signal.aborted) return null;
        const msg = err instanceof Error ? err.message : 'Generation failed';
        setError(msg);
        return null;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [apiKey],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { result, loading, error, generate, reset, cancel };
}
