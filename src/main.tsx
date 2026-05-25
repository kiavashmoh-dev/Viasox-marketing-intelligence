import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installBrainDevTools } from './brain/brainDevTools'
import { ensureFreshVoCIndex } from './brain/vocIndex'

// Install `window.__brain.*` console helpers (preview, enable/disable per
// module, snapshot, etc.). Safe to call here — no side effects unless the
// user actually calls one of the helpers. Does not affect runtime behavior.
installBrainDevTools()

// Pre-warm the VoC index in the background. The first brain-enabled call
// otherwise pays a ~1-3s cost building the index from saved analyses; doing
// it here behind the scenes means that cost is absorbed during page load
// instead of during a user-triggered generation. Failures are non-fatal —
// the index will lazily build on demand if this pre-warm fails for any
// reason (e.g. IndexedDB unavailable).
ensureFreshVoCIndex(null).then(
  (idx) => console.info(`[brain] VoC index pre-warmed (${idx.sources.commentCount.toLocaleString()} comments, ${idx.sources.reviewCount.toLocaleString()} reviews)`),
  (err) => console.warn('[brain] background VoC index pre-warm failed', err),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
