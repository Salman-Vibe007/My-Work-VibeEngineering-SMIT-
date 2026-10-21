import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = { title: 'Pre Legal Document Generator', description: 'Prepare draft legal documents from simple templates.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('pl_theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <div className="notice"><div className="wrap"><strong>Not legal advice.</strong> This tool prepares drafts only. Laws differ by country; verify everything and consult a qualified lawyer when needed.</div></div>
        <main><div className="wrap">{children}</div></main>
        <footer className="site"><div className="wrap">Pre Legal Document Generator is a document-preparation tool. It does not provide legal representation or guarantee that a document is valid, enforceable, or suitable for your situation. Templates are drafts and have not been legally reviewed.</div></footer>
      </body>
    </html>
  );
}
