import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel Party Rules",
  description: "Правила сервера Pixel Party",
  icons: { icon: "/server-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
