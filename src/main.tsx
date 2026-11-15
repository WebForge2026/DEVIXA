import '@fontsource-variable/unbounded';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';

import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Prerendered pages hydrate; the generic shell (admin, unknown routes) mounts fresh.
if (container.childNodes.length > 0) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
