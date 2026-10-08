import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Task & Team Management | Assignment 2',
  description:
    'Assignment 2 - Task & Team Management application with Authentication, RBAC, Teams, and Tasks built with Next.js, Prisma, PostgreSQL (Supabase), and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased flex flex-col justify-between">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
