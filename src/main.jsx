import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'
import { AuthProvider } from './contexts/AuthContext'

// Handle dynamic import/chunk loading failures gracefully by reloading to fetch the new deployment
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch')) {
    console.warn('Dynamic asset import failed. Reloading page...');
    window.location.reload();
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || '';
  if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch')) {
    console.warn('Dynamic asset import rejected. Reloading page...');
    window.location.reload();
  }
});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
