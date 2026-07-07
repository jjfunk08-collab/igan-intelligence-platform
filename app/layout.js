import "./globals.css";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { COMPANY } from "../lib/config";
import Masthead from "../components/Masthead";
import Footer from "../components/Footer";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  title: `${COMPANY.product} — ${COMPANY.shortName}`,
  description: `${COMPANY.productLong}. A ${COMPANY.shortName} intelligence platform.`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable} ${plexMono.variable}`}>
      <body>
        <Masthead />
        <main className="container">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
