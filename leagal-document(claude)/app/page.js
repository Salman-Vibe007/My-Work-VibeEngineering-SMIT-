import Link from 'next/link';
import { T } from '@/lib/templates';
import { paper } from '@/lib/render';

export default function Home() {
  const fc = T.find(t => t.id === 'freelance-contract'), d = {};
  fc.f.forEach((f, i) => { d[f.n] = fc.ex[i]; });
  return (
    <section className="hero">
      <div>
        <h1>Draft the paperwork. <em>Skip the blank page.</em></h1>
        <p>Pick a template, answer a few plain-language questions, and watch your document write itself. Review, then save it as a PDF.</p>
        <p><Link className="btn p" href="/templates">Browse templates →</Link></p>
        <ul className="steps"><li>1 · Pick</li><li>2 · Fill in</li><li>3 · Preview</li><li>4 · Download</li></ul>
      </div>
      <div>
        <div className="stat"><span className="pill ok">Sample preview</span><span>A finished Freelance Contract</span></div>
        <div className="paper" dangerouslySetInnerHTML={{ __html: paper(fc, d) }} />
      </div>
    </section>
  );
}
