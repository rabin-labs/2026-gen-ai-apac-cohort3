import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private Compass",
  description: "A secure Gemini-powered decision journal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
