import React, { ReactNode } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
