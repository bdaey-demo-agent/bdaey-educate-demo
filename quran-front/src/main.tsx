import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { injectSpeedInsights } from '@vercel/speed-insights'
import './styles/variables.css'
import './styles/components.css'
import './styles/utilities.css'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { applyBrandColors } from './branding'
import { loadRuntimeBranding } from './services/brandingService'

injectSpeedInsights({ debug: false });

// Apply build-time brand colors immediately (no flash), then let the
// deployment's runtime branding (GET /api/branding) refine them before render.
applyBrandColors();

function renderApp(App: typeof import('./App.tsx').default) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>,
  )
}

// Defer importing App (and every page) until runtime branding resolves so
// module-level brand constants capture the server's values. Never block
// startup on a slow API: loadRuntimeBranding times out and fails soft.
loadRuntimeBranding().finally(() => {
  import('./App.tsx').then((m) => renderApp(m.default))
})
