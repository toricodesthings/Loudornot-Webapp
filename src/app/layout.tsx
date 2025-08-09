// src/app/layout.tsx
import './globals.css';
import { Lexend } from 'next/font/google';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { Analytics } from "@vercel/analytics/react"
import ThemeSwitch from '@/components/ThemeSwitch/ThemeSwitch';

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'Loudornot Home',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html lang="en">
      <body className={lexend.className}>
        <Analytics />
        <div className='app-container'>
        <ThemeProvider>
          <div className='app-content'>
            {children}
          </div>
          <ThemeSwitch />
        </ThemeProvider>
        </div>
      </body>
    </html>
  );
}

