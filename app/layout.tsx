import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "../components/providers/store-provider";
import ThemeProvider from "../components/providers/theme-provider";
import LanguageProvider from "../components/providers/language-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pich Chamroeun Pharmacy POS",
  description: "Stock POS System Client App",
  icons: {
    icon: [
      { url: '/logo.jpg', type: 'image/jpeg' }
    ],
    shortcut: ['/logo.jpg'],
    apple: [
      { url: '/logo.jpg', type: 'image/jpeg' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <ThemeProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
