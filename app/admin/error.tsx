'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
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
    <div className="flex items-center justify-center min-h-[60vh] bg-[#000000] px-4">
      <div className="bg-[#061206] border border-[#11331c] rounded-2xl p-10 text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-[#d8ffcf] font-bold text-xl mb-2">Page Error</h2>
        <p className="text-[#9df5aa] text-sm mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#00E676] hover:bg-[#00cc66] text-black text-sm font-medium rounded-lg px-5 py-2 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="bg-[#0b2f15] hover:bg-[#103b1c] text-[#a8ffb7] text-sm font-medium rounded-lg px-5 py-2 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
