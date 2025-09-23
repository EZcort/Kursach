import './globals.css';

export const metadata = {
  title: 'Авторизация',
  description: 'Страница входа и регистрации',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
