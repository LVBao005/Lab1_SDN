import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <p>Assignment 1: Task &amp; Team Management · Next.js App Router + Prisma ORM + Supabase PostgreSQL</p>
        <p className="font-mono text-[11px] text-zinc-400">Endpoint: GET / POST /api/tasks · PUT / DELETE /api/tasks/[id]</p>
      </div>
    </footer>
  );
}

export default Footer;
