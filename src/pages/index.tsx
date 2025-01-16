import React from 'react';
import { Inter } from 'next/font/google';
import { SWRConfig } from 'swr';
import WeatherWidget from '../components/WeatherWidget'; 
 
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});
 
export default function Home() {
  return (
    <SWRConfig 
      value={{
        refreshInterval: 300000, // 5 minutes
        revalidateOnFocus: true,
        revalidateOnReconnect: true
      }}
    >
      <div
        className={`${inter.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-black`}
      >
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <WeatherWidget />
        </main>
        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-white">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://anti.space"
            target="_blank"
            rel="noopener noreferrer"
          >
          </a>
        </footer>
      </div>
    </SWRConfig>
  );
}