// ======================================
// Bero System - Main Entry Point (SaaS Version)
// ======================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// تحميل مساعد الاختبار للنظام
import './utils/saasTestHelper';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
