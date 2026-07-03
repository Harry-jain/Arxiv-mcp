import "./globals.css";

export const metadata = {
  title: "arXiv Research MCP",
  description: "Search arXiv and build a reading list, powered by an MCP server.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
