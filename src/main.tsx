
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// polyfill for mgt.clearMarks runtime error if loaded by a third-party script
if (typeof window !== 'undefined') {
  const mgt = (window as any).mgt;
  if (mgt && typeof mgt.clearMarks !== 'function') {
    mgt.clearMarks = () => undefined;
  }
}

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
