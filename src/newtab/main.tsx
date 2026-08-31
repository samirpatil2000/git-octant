import React from 'react';
import ReactDOM from 'react-dom/client';
import { NewTab } from './NewTab';
import '../styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <NewTab />
  </React.StrictMode>
);
