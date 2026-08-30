import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { BASE_PATH } from "@/lib/base-path";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans"
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata = {
  title: "QuadQR | Create & Scan",
  description: "Create and scan QuadQR codes from your browser.",
  applicationName: "QuadQR",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuadQR"
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icons/icon-512.png`, sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: `${BASE_PATH}/icons/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }]
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" }
  ]
};

const themeScript = `
  try {
    const saved = localStorage.getItem("quadqr-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
