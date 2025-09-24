import "@/styles/globals.css";
import ConditionalHeader from "@/components/CommonComponents/layout/ConditionalHeader";
import ConditionalFooter from "@/components/CommonComponents/layout/ConditionalFooter";
import { APP_CONFIG } from "@/components/config";

export const metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <ConditionalHeader />
        <main className="flex-1">
          {children}
        </main>
        <ConditionalFooter />
      </body>
    </html>
  );
}
