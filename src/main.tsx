import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[main.tsx] Starting app mount...');

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', { style: { color: 'white', padding: 20 } },
        React.createElement('h1', null, 'App Error'),
        React.createElement('pre', null, this.state.error.message),
        React.createElement('pre', null, this.state.error.stack)
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
console.log('[main.tsx] Root element:', rootEl);

if (rootEl) {
  try {
    const root = createRoot(rootEl);
    console.log('[main.tsx] createRoot succeeded, rendering...');
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    console.log('[main.tsx] render() called successfully');
  } catch (err) {
    console.error('[main.tsx] Fatal error during mount:', err);
    rootEl.innerHTML = `<div style="color:white;padding:20px"><h1>Mount Error</h1><pre>${err}</pre></div>`;
  }
} else {
  console.error('[main.tsx] #root element not found!');
  document.body.innerHTML = '<div style="color:white;padding:20px">ERROR: #root not found</div>';
}

