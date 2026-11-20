import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@astryxdesign/theme-neutral/fonts.css';
import '@astryxdesign/theme-neutral/theme.css';
import './styles/global.css';
import { App } from './app/App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
