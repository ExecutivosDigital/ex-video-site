import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Executivos Digital",
  description:
    "Software House especializada em negócios e Inteligência Artificial",
  metadataBase: new URL("https://executivosdigital.com.br"),
  icons: {
    icon: "./icon.png",
  },
  themeColor: "#000000",
  openGraph: {
    title: "Executivos Digital",
    description:
      "Software House especializada em negócios e Inteligência Artificial",
    siteName: "Executivos Digital",
    url: "https://executivosdigital.com.br",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      <body className={`${poppins.variable}`}>
        <>{children}</>
        <Script id="ms_clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "rn2o2ckgow");`}
        </Script>
        <GoogleAnalytics gaId="G-T256KFLG4B" />
      </body>
    </html>
  );
}
