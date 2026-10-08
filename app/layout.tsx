import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'AI Medical Research Bounty',
  description: 'Платформа сбора средств и научных грантов для исследователей на решение нерешенных медицинских проблем и редких заболеваний.',
  openGraph: {
    title: 'AI Medical Research Bounty',
    description: 'Платформа сбора средств и научных грантов для исследователей на решение нерешенных медицинских проблем и редких заболеваний.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Medical Research Bounty',
    description: 'Платформа сбора средств и научных грантов для исследователей на решение нерешенных медицинских проблем и редких заболеваний.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-[#07090e] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
