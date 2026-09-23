'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm max-w-md w-full text-center">
          <h2 className="text-lg font-bold text-zinc-900 mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-sm text-zinc-600 mb-4">{error?.message || 'Lỗi không xác định'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
