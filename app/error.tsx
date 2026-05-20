'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4">
      <div className="bg-[#050f05] border border-[#11331c] rounded-2xl p-10 text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-[#cfffdf] font-bold text-xl mb-2">Something went wrong</h2>
        <p className="text-[#9df5aa] text-sm mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="bg-[#00E676] hover:bg-[#00cc66] text-black text-sm font-medium rounded-lg px-5 py-2 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
