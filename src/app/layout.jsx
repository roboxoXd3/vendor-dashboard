import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import QueryProvider from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vendor Dashboard",
  description: "A dashboard for managing vendors",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
