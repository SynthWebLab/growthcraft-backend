import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Dancing_Script } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dancingScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GrowthCraft - Where Learning Meets Opportunity",
  description:
    "GrowthCraft - Your all-in-one platform to learn tech, master industry skills, join hands-on bootcamps, connect with mentors, and land your dream job.",
  authors: [{ name: "GrowthCraft by SYNTHWEB" }],
  keywords: [
    "tech education",
    "bootcamps",
    "coding courses",
    "web development",
    "data science",
    "career training",
  ],
  openGraph: {
    title: "GrowthCraft - Where Learning Meets Opportunity",
    description:
      "Learn tech, master skills, join bootcamps, connect with mentors, and land your dream job.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowthCraft - Where Learning Meets Opportunity",
    description:
      "Learn tech, master skills, join bootcamps, and land your dream job.",
  },
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dancingScript.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pt-16 lg:pt-20">{children}</main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
