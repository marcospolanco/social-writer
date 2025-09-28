import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexContextProvider } from './providers/ConvexProvider';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexContextProvider>
      <App />
    </ConvexContextProvider>
  </StrictMode>,
);