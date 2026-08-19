import "./globals.css";

export const metadata = {
  title: "Premier League Position Predictor",
  description: "Predict the 2026-27 Premier League table and track it against the real thing, gameweek by gameweek.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
