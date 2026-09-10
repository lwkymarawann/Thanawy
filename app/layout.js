import "./globals.css";

export const metadata = {
  title: "Thanaweya Tracker",
  description: "Shared class calendar and grade tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
