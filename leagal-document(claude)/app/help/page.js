const Q = [
  ['Is this legal advice?', 'No. It prepares drafts only. Laws differ by country, so verify the content and consult a qualified lawyer when needed.'],
  ['Have the templates been reviewed by a lawyer?', 'No. They are simple drafts and have not been legally reviewed.'],
  ['Where are my documents stored?', 'If you are logged in, in your account. Otherwise only in this browser; clearing browser data deletes them.'],
  ['How do I get a PDF?', 'Fill the form, tick the checklist, click "Print / Save as PDF", and choose "Save as PDF" as the printer.'],
  ['What do the highlighted brackets mean?', 'They mark information you have not filled in yet, such as [Client name].'],
  ['Can I edit a saved draft?', 'Yes. Open it from My Documents. Changes are saved automatically.'],
];
export default function Help() {
  return (
    <>
      <h1 style={{ margin: '0 0 16px' }}>Help &amp; FAQ</h1>
      {Q.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </>
  );
}
