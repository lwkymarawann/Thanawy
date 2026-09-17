import "./globals.css";

export const metadata = {
  title: "Thanaweya Tracker",
  description: "Shared class calendar and grade tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Thanaweya",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#14151d" },
  ],
};

// Runs before paint so the saved theme applies immediately — no flash of
// the wrong theme on load, especially noticeable on mobile.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("thanaweya-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
