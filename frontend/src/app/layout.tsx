import './globals.css';

export const metadata = {
  title: 'SafeSight',
  description: 'AI-Based Visitor Safety & Crowd Coordination',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
