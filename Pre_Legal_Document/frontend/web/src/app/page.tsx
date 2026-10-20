import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Menu,
  ShieldCheck,
} from 'lucide-react'

const templateGroups = [
  {
    number: '01',
    category: 'Business',
    examples: ['Service agreements', 'Confidentiality agreements', 'Consulting terms'],
    tone: 'mint',
  },
  {
    number: '02',
    category: 'Work & freelance',
    examples: ['Offer letters', 'Project agreements', 'Payment terms'],
    tone: 'blue',
  },
  {
    number: '03',
    category: 'Personal & property',
    examples: ['Authorization letters', 'Rental notices', 'Declarations'],
    tone: 'coral',
  },
]

export default function HomePage() {
  return (
    <main className="home-page">
      <header className="site-header">
        <nav className="site-nav page-shell" aria-label="Main navigation">
          <Link href="/" className="brand" aria-label="Prelegal home">
            <span className="brand-mark"><FileCheck2 size={19} strokeWidth={2.2} /></span>
            <span>prelegal<span className="brand-period">.</span></span>
          </Link>
          <div className="nav-links">
            <Link href="#how-it-works">How it works</Link>
            <Link href="/templates">Templates</Link>
          </div>
          <div className="nav-actions">
            <Link href="/signin" className="sign-in-link">Sign in</Link>
            <Link href="/signup" className="nav-cta">Get started <ArrowRight size={15} /></Link>
          </div>
          <Link href="/templates" className="mobile-menu" aria-label="Browse templates"><Menu size={20} /></Link>
        </nav>
      </header>

      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> DOCUMENT PREPARATION, MADE CLEAR</p>
          <h1>The first draft shouldn’t be the <em>hardest</em> part.</h1>
          <p className="hero-description">
            Start with a guided template, shape it around your situation, and review every detail before you export.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="button-primary">Start a draft <ArrowRight size={17} /></Link>
            <Link href="/templates" className="button-text">Explore templates <ArrowDownRight size={17} /></Link>
          </div>
          <p className="hero-note"><ShieldCheck size={15} /> You stay in control of every word.</p>
        </div>

        <div className="preview-stage" aria-label="Illustration of a document draft ready for review">
          <div className="preview-orbit orbit-one" />
          <div className="preview-orbit orbit-two" />
          <div className="document-window">
            <div className="window-bar">
              <span className="window-dots"><i /><i /><i /></span>
              <span className="window-label">YOUR WORKSPACE</span>
              <span className="save-status"><span /> Saved</span>
            </div>
            <div className="document-layout">
              <aside className="document-rail" aria-hidden="true">
                <span className="rail-icon rail-active"><FileText size={16} /></span>
                <span className="rail-icon"><Check size={16} /></span>
              </aside>
              <div className="document-content">
                <div className="document-meta"><span>BUSINESS</span><span>·</span><span>UNITED STATES</span></div>
                <h2>Service agreement</h2>
                <p className="document-subtitle">A working draft for your review</p>
                <div className="document-rule" />
                <p className="paper-heading">01 &nbsp; The parties</p>
                <p className="paper-copy">This agreement is between <b>Client name</b> and <b>Service provider</b>, starting on <b>Effective date</b>.</p>
                <p className="paper-heading">02 &nbsp; Scope of work</p>
                <p className="paper-copy">Describe the services, deliverables, and timing that both parties have discussed.</p>
                <div className="field-callout"><span className="callout-icon"><Check size={13} /></span><span><b>Review before exporting</b><small>3 fields still need your attention</small></span><ChevronRight size={15} /></div>
              </div>
            </div>
          </div>
          <div className="floating-note"><span className="note-check"><Check size={14} /></span><span><b>Your draft, your call</b><small>Edit everything before export</small></span></div>
          <span className="preview-caption">A clearer path from blank page to first draft.</span>
        </div>
      </section>

      <section className="workflow-strip" id="how-it-works">
        <div className="page-shell workflow-inner">
          <div className="workflow-heading"><span>LESS BLANK PAGE.</span><span>MORE FORWARD MOMENTUM.</span></div>
          <div className="workflow-steps">
            <div className="workflow-step"><span className="step-number">01</span><span><b>Choose a starting point</b><small>Find a template for the job at hand.</small></span></div>
            <div className="step-connector" aria-hidden="true" />
            <div className="workflow-step"><span className="step-number">02</span><span><b>Fill in what matters</b><small>Answer clear questions, one step at a time.</small></span></div>
            <div className="step-connector" aria-hidden="true" />
            <div className="workflow-step"><span className="step-number">03</span><span><b>Review your draft</b><small>Check the details and make it your own.</small></span></div>
          </div>
        </div>
      </section>

      <section className="templates-section page-shell" id="templates">
        <div className="section-heading">
          <div><p className="eyebrow">A PLACE TO BEGIN</p><h2>Useful structure.<br /><em>Your words.</em></h2></div>
          <div className="section-aside"><p>Explore a starting point for everyday business, work, and personal paperwork.</p><Link href="/templates" className="button-text">Browse the library <ArrowRight size={16} /></Link></div>
        </div>
        <div className="template-list">
          {templateGroups.map((group) => (
            <Link href="/templates" className={`template-row template-${group.tone}`} key={group.number}>
              <span className="template-number">{group.number}</span>
              <span className="template-title">{group.category}</span>
              <span className="template-examples">{group.examples.join('  ·  ')}</span>
              <span className="template-arrow" aria-hidden="true"><ArrowRight size={19} /></span>
            </Link>
          ))}
        </div>
        <p className="catalog-note"><ShieldCheck size={15} /> Template availability and jurisdiction vary. Review each template’s details before use.</p>
      </section>

      <section className="closing-band">
        <div className="page-shell closing-inner">
          <div><p className="eyebrow">A GOOD PLACE TO START</p><h2>Make room for the work<br />that comes <em>after</em> the paperwork.</h2></div>
          <Link href="/templates" className="closing-link">Find your template <ArrowRight size={17} /></Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-main">
          <Link href="/" className="brand footer-brand"><span className="brand-mark"><FileCheck2 size={18} /></span><span>prelegal<span className="brand-period">.</span></span></Link>
          <p>Thoughtful tools for a clearer first draft.</p>
          <div className="footer-links"><Link href="/templates">Templates</Link><Link href="/signin">Sign in</Link><Link href="/signup">Create account</Link></div>
        </div>
        <div className="page-shell footer-legal"><span>© {new Date().getFullYear()} Prelegal</span><p>Prelegal helps prepare document drafts; it does not provide legal advice or representation. Laws vary by location. Consider consulting a qualified legal professional.</p></div>
      </footer>
    </main>
  )
}