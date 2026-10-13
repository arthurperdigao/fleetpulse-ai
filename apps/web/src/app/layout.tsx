import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap'
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'FleetPulse AI · Observabilidade de Preços de Aluguel de Carros em BH',
  description:
    'Ferramenta analítica que compara preços de locadoras em Belo Horizonte, detecta variações fora do habitual e responde perguntas com números auditados no banco de dados.',
  keywords: [
    'FleetPulse AI',
    'Preços aluguel de carros',
    'Belo Horizonte',
    'Observabilidade de tarifas',
    'Localiza',
    'Movida',
    'Unidas'
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
