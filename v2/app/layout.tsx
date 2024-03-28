import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/providers";
import { FooterItems } from "@/lib/ui/footer";
import { auth } from "./auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lunsj Fornebu",
  description: "Food for the people!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>
          <Providers>
            <div className="flex flex-col backdrop-blur-sm w-full h-full bg-primary">
              {children}

                <footer className="flex p-2 text-white justify-between underline">
                  <a 
                  target="_blank"
                  href="https://no.linkedin.com/in/sebastian-nordby-b45087152">
                      Utviklet av Nordby
                  </a>

                  <FooterItems session={session}/>
                </footer>
            </div>
          </Providers>
      </body>
    </html>
  );
}
