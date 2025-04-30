import React from 'react';
export default function Snackbar({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg flex items-center">
      {children}
      <button onClick={onClose} className="ml-4 text-gray-400">✕</button>
    </div>
  );
}