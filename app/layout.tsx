import React from 'react';
import type { Metadata } from 'next';
import '@/src/index.css';

export const metadata: Metadata = {
  title: 'Task & Team Management',
  description: 'Assignment 1 - Task & Team Management built with Next.js, Prisma, PostgreSQL (Supabase), and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
