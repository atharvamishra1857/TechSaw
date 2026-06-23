import "./globals.css";
import Sidebar from "./components/sidebar";
// import { usePathname } from "next/navigation";

export const metadata = {
  title: `${process.env.NEXT_PUBLIC_CLIENT_NAME} | TechSaw OS`,
  description: "Smart Factory Pipeline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">

        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}