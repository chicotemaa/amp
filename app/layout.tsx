import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { FilterProvider } from '@/contexts/filter-context';
import Header from '@/components/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ArquiManagerPro',
  description: 'Sistema de gestión de proyectos arquitectónicos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FilterProvider>
            <div className="relative min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 container py-6">{children}</main>
            </div>
          </FilterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}