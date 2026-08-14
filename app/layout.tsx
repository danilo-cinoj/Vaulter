import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaulter — anonymous messages",
  description: "Send kind anonymous messages with Vaulter.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
