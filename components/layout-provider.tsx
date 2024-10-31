"use client";

import { ThemeProvider } from '@/components/theme-provider';
import { FilterProvider } from '@/contexts/filter-context';

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <FilterProvider>{children}</FilterProvider>
    </ThemeProvider>
  );
}