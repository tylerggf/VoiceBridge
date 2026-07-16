import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoiceBridge',
  description: 'Free AI voice translator for live conversations.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
