export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const val=(d,n)=>String(d[n]==null?'':d[n]).trim();
export const fmt=(f,v)=>{if(f&&f.t==='date'){const d=new Date(v+'T00:00:00');if(!isNaN(d))return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}return v};
export const build=(t,d,html)=>t.s.filter(s=>!s.if||val(d,s.if)).map((s,i)=>({title:(i+1)+'. '+s.t,body:s.c.replace(/\{\{(\w+)\}\}/g,(m,n)=>{const f=t.f.find(x=>x.n===n),v=val(d,n),o=v?fmt(f,v):'['+(f?f.l:n)+']';return html?(v?esc(o):'<mark>'+esc(o)+'</mark>'):o})}));
export const missing=(t,d)=>t.f.filter(f=>f.r&&!val(d,f.n));
export const paper=(t,d)=>'<h2>'+esc(t.title)+'</h2>'+build(t,d,true).map(s=>'<h3>'+esc(s.title)+'</h3><p>'+s.body+'</p>').join('')+'<div class="disc">Draft prepared with Pre Legal Document Generator. Not legal advice; verify all details and consult a qualified lawyer where needed.</div>';
export const toText=(t,d)=>t.title.toUpperCase()+'\n\n'+build(t,d,false).map(s=>s.title+'\n'+s.body).join('\n\n')+'\n\n---\nDraft only. Not legal advice.';
