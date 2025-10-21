// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Мое приложение',
  description: 'Приложение с авторизацией',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
