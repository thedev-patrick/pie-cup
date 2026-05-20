'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html>
      <body className="global-error-layout">
        <div className="global-error-card">
          <div className="global-error-icon">⚠️</div>
          <h2 className="global-error-title">Something went wrong</h2>
          <p className="global-error-message">{error.message}</p>
          <button onClick={reset} className="global-error-button">Try again</button>
        </div>
      </body>
    </html>
  );
}
