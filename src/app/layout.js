import "@/styles/globals.css";
import ConditionalHeader from "@/components/CommonComponents/layout/ConditionalHeader";
import ConditionalFooter from "@/components/CommonComponents/layout/ConditionalFooter";
import { APP_CONFIG } from "@/components/config";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-sans overflow-x-hidden" suppressHydrationWarning>
        {/* <ConditionalHeader /> */}
        <main className="flex-1">
          {children}
        </main>
        {/* <ConditionalFooter /> */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
