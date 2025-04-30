import * as React from "react";

export function Toast({
  message,
  onClose
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
      {message}
      <button
        onClick={onClose}
        className="ml-4 text-sm text-red-300 hover:underline"
      >
        Close
      </button>
    </div>
  );
}
