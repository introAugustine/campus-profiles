import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Profiles",
  description: "Get featured to the incoming class",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}