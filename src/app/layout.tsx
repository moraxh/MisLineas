import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import FaviconLight from "@/app/favicon.ico";
import FaviconDark from "@/app/favicon_dark.ico";

const siteUrl = "https://mislineas.com.mx";
const siteName = "MisLíneas";
const siteTitle = "MisLíneas - Consulta líneas telefónicas por CURP";
const siteDescription =
  "Consulta las plataformas disponibles de operadoras móviles para revisar qué líneas aparecen vinculadas a tu CURP.";
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      alternateName: "Mis Lineas",
      description: siteDescription,
      inLanguage: "es-MX",
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/favicon.ico`,
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s - ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    siteName,
    "CURP",
    "Líneas telefónicas",
    "Telcel",
    "Altán Redes",
    "México",
    "Operadoras",
  ],
  alternates: {
    canonical: "/",
  },
  applicationName: siteName,
  authors: [{ name: "Moraxh", url: "https://github.com/moraxh" }],
  creator: "Moraxh",
  publisher: siteName,
  category: "utility",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName,
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 628,
        alt: "MisLíneas, consulta líneas telefónicas vinculadas a tu CURP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.jpg"],
  },
  icons: [
    {
      rel: "icon",
      media: "(prefers-color-scheme: light)",
      type: "image/ico",
      url: FaviconLight.src,
    },
    {
      rel: "icon",
      media: "(prefers-color-scheme: dark)",
      type: "image/ico",
      url: FaviconDark.src,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        {children}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static metadata generated from local constants.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Analytics />
      </body>
    </html>
  );
}
