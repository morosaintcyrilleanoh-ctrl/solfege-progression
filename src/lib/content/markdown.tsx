/**
 * Affichage du contenu des leçons : un sous-ensemble simple de Markdown
 * (titres, paragraphes, listes, gras, italique, liens https). Aucun HTML brut
 * n'est interprété : le texte est toujours échappé par React.
 */
import type { ReactNode } from 'react';

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https:\/\/[^\s)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(<strong key={`${keyBase}-${k++}`}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith('*')) out.push(<em key={`${keyBase}-${k++}`}>{t.slice(1, -1)}</em>);
    else {
      const label = t.slice(1, t.indexOf(']'));
      const href = t.slice(t.indexOf('(') + 1, -1);
      out.push(
        <a key={`${keyBase}-${k++}`} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-electric-600 underline">
          {label}
        </a>,
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function LessonContent({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const linesList = source.replace(/\r\n/g, '\n').split('\n');
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(' '), `p${blocks.length}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, `l${blocks.length}-${i}`)}</li>);
    blocks.push(list.ordered ? <ol key={`o${blocks.length}`} className="list-decimal pl-6">{items}</ol> : <ul key={`u${blocks.length}`} className="list-disc pl-6">{items}</ul>);
    list = null;
  };
  for (const raw of linesList) {
    const line = raw.trimEnd();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      const level = (h[1] as string).length;
      const content = inline(h[2] as string, `h${blocks.length}`);
      blocks.push(
        level === 1 ? <h2 key={`h${blocks.length}`} className="text-xl font-bold text-night-800">{content}</h2>
        : level === 2 ? <h3 key={`h${blocks.length}`} className="text-lg font-bold text-night-800">{content}</h3>
        : <h4 key={`h${blocks.length}`} className="font-bold text-night-800">{content}</h4>,
      );
    } else if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(((ul ?? ol) as RegExpExecArray)[1] as string);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className="space-y-3 leading-relaxed text-slate-800">{blocks}</div>;
}
