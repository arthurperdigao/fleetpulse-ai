import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FleetPulse AI | Observabilidade de Preços & Inteligência de Mercado',
  description:
    'Monitor de saúde de preços para frotas de locação de veículos: detecta anomalias, audita integridade de IA e responde com números verificados.',
  keywords: [
    'FleetPulse AI',
    'Observabilidade de Preços',
    'Inteligência de Mercado',
    'Localiza',
    'Pricing',
    'SDET',
    'QA em IA'
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
