import React from 'react';
import { ToastProvider } from './components/Toast';
import CleanWorkspaceView from './views/CleanWorkspaceView';

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        <CleanWorkspaceView />
      </div>
    </ToastProvider>
  );
}
