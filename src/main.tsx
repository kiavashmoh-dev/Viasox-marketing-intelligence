import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installBrainDevTools } from './brain/brainDevTools'

// Install `window.__brain.*` console helpers (preview, enable/disable per
// module, snapshot, etc.). Safe to call here — no side effects unless the
// user actually calls one of the helpers. Does not affect runtime behavior.
installBrainDevTools()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
