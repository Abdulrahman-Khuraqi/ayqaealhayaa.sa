import type { Metadata, Viewport } from 'next';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { storeCategories } from '@/lib/catalog';
import { site } from '@/lib/site';
import './globals.css';

const display = Changa({ subsets: ['arabic', 'latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
const body = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | أجهزة أمنية وذكية، برمجة واستضافة`, template: `%s | ${site.name}` },
  description: 'متجر سعودي لكاميرات المراقبة والأجهزة الذكية والشبكات، مع خدمات برمجة المواقع والتطبيقات والاستضافة والمنتجات الرقمية بأسعار واضحة شاملة الضريبة.',
  openGraph: { type: 'website', locale: 'ar_SA', siteName: site.name, images: ['/logo-256.png'] },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = { themeColor: '#15110f' };

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.legalName,
  alternateName: site.name,
  url: site.url,
  logo: `${site.url}/logo-256.png`,
  email: site.email,
  telephone: `+${site.phoneIntl}`,
  vatID: site.vatNumber,
  address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'SA' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="skip-link">انتقل إلى المحتوى</a>
        <CartProvider>
          <Header categories={storeCategories.map(({ slug, name }) => ({ slug, name }))} />
          <main id="main">{children}</main>
          <Footer />
        </CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      </body>
    </html>
  );
}
