
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// polyfill for mgt.clearMarks runtime error if loaded by a third-party script
const patchMgtClearMarks = () => {
  if (typeof window === 'undefined') return;
  const mgt = (window as any).mgt;
  if (!mgt) return;
  if (typeof mgt.clearMarks !== 'function') {
    mgt.clearMarks = () => undefined;
  }
};

if (typeof window !== 'undefined') {
  patchMgtClearMarks();

  const interval = window.setInterval(patchMgtClearMarks, 200);
  window.addEventListener('load', () => {
    patchMgtClearMarks();
    window.clearInterval(interval);
  });

  window.setTimeout(() => {
    window.clearInterval(interval);
  }, 6000);
}

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
