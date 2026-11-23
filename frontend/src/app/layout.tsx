import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevSync Enterprise — Next-Gen B2B Workspace & Engineering OS',
  description: 'Enterprise-grade multi-tenant project management, sprint orchestration, and real-time collaboration platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
