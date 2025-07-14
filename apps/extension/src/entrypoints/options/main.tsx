import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/ui/style/fonts.css';
import { BrowserRouter } from 'react-router-dom';
import SortHat from '@/ui/views/SortHat';
import { WindowProvider } from '@/ui/utils/WindowContext';
import '../../modules';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <WindowProvider>
          <SortHat />
        </WindowProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
