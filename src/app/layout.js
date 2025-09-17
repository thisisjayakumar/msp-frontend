import "@/styles/globals.css";
import Header from "@/components/CommonComponents/layout/Header";
import Footer from "@/components/CommonComponents/layout/Footer";
import { APP_CONFIG } from "@/components/config";

export const metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
