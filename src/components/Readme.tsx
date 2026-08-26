import { ReactNode, useMemo } from "react";
import { PYTHON_FILES } from "../data/python";
import { Chip, Kicker, SectionTitle, usePrefersReducedMotion, useReveal } from "../lib/ui";
import { Highlight } from "./Highlight";

/* ------------------------------------------------------------------ */
/* markdown → blocks (line-based, tailored to this repo's README)     */
/* ------------------------------------------------------------------ */

type Block =
  | { t: "h"; level: number; text: string; id: string }
  | { t: "p"; text: string }
  | { t: "quote"; lines: string[] }
  | { t: "code"; lang: string; code: string }
  | { t: "ul"; items: { text: string; checked?: boolean }[] }
  | { t: "ol"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "hr" }
  | { t: "badges"; badges: { label: string; value: string; color: string }[] }
  | { t: "fig"; src: string; alt: string; caption?: string };

const slug = (s: string) =>
  s.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "");

function parseBadge(url: string): { label: string; value: string; color: string } | null {
  const m = url.match(/img\.shields\.io\/badge\/(.+?)(?:\?|$)/);
  if (!m) return null;
  const segs = m[1].split("-");
  const color = segs.pop() ?? "58c7f3";
  const label = segs.shift() ?? "";
  const value = segs.join("-").replace(/_/g, " ").replace(/%25/g, "%");
  return { label: label.replace(/_/g, " "), value, color };
}

function parse(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "text";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ t: "code", lang, code: buf.join("\n") });
      continue;
    }
    if (/^!\[[^\]]*\]\(https:\/\/img\.shields\.io\/badge\//.test(line)) {
      const badges: { label: string; value: string; color: string }[] = [];
      while (i < lines.length) {
        const b = lines[i].match(/^!\[([^\]]*)\]\((https:\/\/img\.shields\.io\/badge\/[^)]+)\)/);
        if (!b) break;
        const parsed = parseBadge(b[2]);
        if (parsed) badges.push(parsed);
        i++;
      }
      blocks.push({ t: "badges", badges });
      continue;
    }
    const fig = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (fig && !fig[2].includes("shields.io")) {
      let caption: string | undefined;
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j < lines.length && /^\*[^*]+\*$/.test(lines[j].trim())) {
        caption = lines[j].trim().slice(1, -1);
        i = j;
      }
      blocks.push({ t: "fig", src: fig[2], alt: fig[1], caption });
      i++;
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) { blocks.push({ t: "h", level: h[1].length, text: h[2], id: slug(h[2]) }); i++; continue; }
    if (/^---+$/.test(line.trim())) { blocks.push({ t: "hr" }); i++; continue; }
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { buf.push(lines[i].slice(2)); i++; }
      blocks.push({ t: "quote", lines: buf });
      continue;
    }
    if (line.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const split = (s: string) => s.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = split(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) { rows.push(split(lines[i])); i++; }
      blocks.push({ t: "table", head, rows });
      continue;
    }
    if (/^-\s+/.test(line)) {
      const items: { text: string; checked?: boolean }[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        let text = lines[i].replace(/^-\s+/, "");
        const task = text.match(/^\[( |x)\]\s+(.*)/);
        if (task) {
          items.push({ text: task[2], checked: task[1] === "x" });
        } else {
          while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) { i++; text += " " + lines[i].trim(); }
          items.push({ text });
        }
        i++;
      }
      blocks.push({ t: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        let text = lines[i].replace(/^\d+\.\s+/, "");
        while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) { i++; text += " " + lines[i].trim(); }
        items.push(text);
        i++;
      }
      blocks.push({ t: "ol", items });
      continue;
    }
    // indented (4-space) code block — CLI transcripts, trees, JSON
    if (/^ {4}\S/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && (/^ {4}/.test(lines[i]) || lines[i].trim() === "")) {
        buf.push(lines[i].replace(/^ {4}/, ""));
        i++;
      }
      while (buf.length && buf[buf.length - 1].trim() === "") buf.pop();
      const code = buf.join("\n");
      const lang = /^\s*\{/.test(code) ? "json" : "text";
      blocks.push({ t: "code", lang, code });
      continue;
    }
    let text = line;
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() !== "" &&
      !/^(#{1,3}\s|```|>\s|\||-\s|\d+\.\s|!\[|---| {4}\S)/.test(lines[i + 1])
    ) {
      i++;
      text += " " + lines[i].trim();
    }
    blocks.push({ t: "p", text });
    i++;
  }
  return blocks;
}

/* ---------- inline formatting ---------- */

function Inline({ text, reduced }: { text: string; reduced: boolean }): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith("**")) parts.push(<strong key={k++} className="font-semibold text-paper">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={k++} className="rounded border border-line-soft bg-ink-800 px-1.5 py-0.5 font-mono text-[0.86em] text-cy">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("[")) {
      const lm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/)!;
      if (lm[2].startsWith("#")) {
        const target = `readme-${slug(lm[2].slice(1))}`;
        parts.push(
          <a
            key={k++}
            href={`#${target}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(target)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
            }}
            className="text-cy underline decoration-cy/30 underline-offset-2 transition-colors hover:decoration-cy"
          >
            {lm[1]}
          </a>,
        );
      } else {
        parts.push(<span key={k++} className="text-cy/90">{lm[1]}</span>);
      }
    } else parts.push(<em key={k++} className="text-fog italic">{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>);
  return <>{parts}</>;
}

/* ------------------------------------------------------------------ */
/* screenshot figures — the committed PNGs under docs/img/            */
/* ------------------------------------------------------------------ */

const SCREENSHOTS: Record<string, { src: string; url: string }> = {
  "docs/img/console.png": {
    src: "https://image.qwenlm.ai/generated-images/d62605b8-420f-410b-821e-c2d7c7201118/_result.png",
    url: "nettest.local — #console",
  },
  "docs/img/code.png": {
    src: "https://image.qwenlm.ai/generated-images/d34e61c1-722d-467d-b462-502642897907/_result.png",
    url: "nettest.local — #code",
  },
  "docs/img/council.png": {
    src: "https://image.qwenlm.ai/generated-images/abbfb8e5-bc01-4c48-845a-d4649ba37856/_result.png",
    url: "nettest.local — #council",
  },
};

function Frame({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <figure className="group/fig">
      <div className="overflow-hidden rounded-lg border border-line bg-ink-950 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover/fig:border-cy/40 group-hover/fig:shadow-[0_22px_70px_-28px_rgba(88,199,243,0.35)]">
        <div className="flex items-center gap-2 border-b border-line bg-ink-900 px-3.5 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-fail/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-pass/70" />
          <span className="ml-2 flex min-w-0 items-center gap-2 font-mono text-[10.5px] text-fog">
            <span className="led-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-pass text-pass" />
            <span className="truncate">{title}</span>
          </span>
          <span className="ml-auto hidden font-mono text-[9.5px] uppercase tracking-wider text-fog-dim sm:inline">{tag}</span>
        </div>
        {children}
      </div>
    </figure>
  );
}

function Screenshot({ src, alt, url }: { src: string; alt: string; url: string }) {
  return (
    <Frame title={url} tag="png · 1600×1000">
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* section                                                            */
/* ------------------------------------------------------------------ */

export function Readme() {
  const ref = useReveal<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const md = useMemo(() => PYTHON_FILES.find((f) => f.path === "README.md")?.code ?? "", []);
  const blocks = useMemo(() => parse(md), [md]);

  return (
    <section id="readme" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker index="09">the front door</Kicker>
          <SectionTitle
            sub="README.md rendered the way a reviewer reads it — badges up top, screenshots captured from a seeded run, every table intact, and the limitations paragraph nobody gets to skip."
          >
            The README a reviewer
            <br />
            actually finishes.
          </SectionTitle>
        </div>
        <div className="flex gap-2 pb-1">
          <Chip tone="cy">19 sections</Chip>
          <Chip tone="sim">docs/img/ ×3 committed</Chip>
          <Chip tone="fog">raw copy in the explorer</Chip>
        </div>
      </div>

      {/* repo chrome */}
      <div className="reveal reveal-d1 mt-10 overflow-hidden rounded-lg border border-line bg-ink-900/80">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-ink-850 px-5 py-3">
          <span className="font-mono text-[12px] text-paper">
            network-test-automation / <span className="font-semibold text-cy">README.md</span>
          </span>
          <div className="flex items-center gap-2">
            <Chip tone="pass">branch · main</Chip>
            <Chip tone="fog">24 files</Chip>
            <Chip tone="fog">MIT</Chip>
          </div>
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.18em] text-fog-dim sm:inline">
            rendered · markdown
          </span>
        </div>

        <div className="px-5 py-8 sm:px-10 sm:py-10">
          {blocks.map((b, i) => {
            switch (b.t) {
              case "badges":
                return (
                  <div key={i} className="mb-5 flex flex-wrap gap-1.5">
                    {b.badges.map((bd) => (
                      <span
                        key={bd.label + bd.value}
                        className="inline-flex overflow-hidden rounded-[3px] border border-line-soft font-mono text-[10px] leading-none shadow-sm"
                      >
                        <span className="bg-ink-800 px-2 py-[5px] text-fog">{bd.label}</span>
                        <span className="px-2 py-[5px] font-semibold" style={{ background: `#${bd.color}`, color: "#0a1120" }}>
                          {bd.value}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              case "h": {
                if (b.level === 1)
                  return (
                    <h3 key={i} id={`readme-${b.id}`} className="mb-4 border-b border-line pb-3 font-display text-2xl font-bold tracking-tight text-paper sm:text-[1.7rem]">
                      {b.text}
                    </h3>
                  );
                if (b.level === 2)
                  return (
                    <h4 key={i} id={`readme-${b.id}`} className="mb-3 mt-10 flex scroll-mt-28 items-center gap-2.5 font-display text-lg font-bold text-paper">
                      <span className="h-4 w-[3px] rounded bg-cy/70" />
                      {b.text}
                    </h4>
                  );
                return (
                  <h5 key={i} id={`readme-${b.id}`} className="mb-2 mt-6 scroll-mt-28 font-display text-[15px] font-bold text-paper">
                    {b.text}
                  </h5>
                );
              }
              case "p":
                return (
                  <p key={i} className="mb-3 max-w-4xl text-[13.5px] leading-[1.75] text-fog">
                    <Inline text={b.text} reduced={reduced} />
                  </p>
                );
              case "quote":
                return (
                  <blockquote key={i} className="mb-4 max-w-4xl border-l-2 border-warn/60 bg-warn/[0.05] px-4 py-3">
                    {b.lines.map((l, j) => (
                      <p key={j} className="text-[12.5px] leading-relaxed text-fog">
                        <Inline text={l} reduced={reduced} />
                      </p>
                    ))}
                  </blockquote>
                );
              case "code":
                return (
                  <div key={i} className="code-scroll mb-4 overflow-x-auto rounded-md border border-line bg-ink-950/70 py-3 pl-1">
                    <Highlight code={b.code} lang={b.lang} />
                  </div>
                );
              case "ul":
                return (
                  <ul key={i} className="mb-4 max-w-4xl space-y-1.5">
                    {b.items.map((it, j) => (
                      <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed text-fog">
                        {it.checked !== undefined ? (
                          <span className={`mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${it.checked ? "border-pass/60 bg-pass/15 text-pass" : "border-line text-transparent"}`}>
                            <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round">
                              <path d="M4.5 12.5l5 5L19.5 6.5" />
                            </svg>
                          </span>
                        ) : (
                          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-cy/70" />
                        )}
                        <span>
                          <Inline text={it.text} reduced={reduced} />
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              case "ol":
                return (
                  <ol key={i} className="mb-4 max-w-4xl space-y-1.5">
                    {b.items.map((it, j) => (
                      <li key={j} className="flex gap-3 text-[13px] leading-relaxed text-fog">
                        <span className="mt-px shrink-0 font-mono text-[11px] font-bold text-cy">{j + 1}.</span>
                        <span>
                          <Inline text={it} reduced={reduced} />
                        </span>
                      </li>
                    ))}
                  </ol>
                );
              case "table":
                return (
                  <div key={i} className="code-scroll mb-4 overflow-x-auto rounded-md border border-line">
                    <table className="w-full min-w-[540px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-line bg-ink-850">
                          {b.head.map((hcell, j) => (
                            <th key={j} className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cy">
                              {hcell}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((row, r) => (
                          <tr key={r} className={`border-b border-line-soft last:border-0 transition-colors hover:bg-ink-850/60 ${r % 2 ? "bg-ink-950/30" : ""}`}>
                            {row.map((cell, c) => (
                              <td key={c} className={`px-4 py-2.5 text-[12.5px] leading-relaxed ${c === 0 ? "font-mono text-[11.5px] text-paper" : "text-fog"}`}>
                                <Inline text={cell} reduced={reduced} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              case "fig": {
                const shot = SCREENSHOTS[b.src];
                return (
                  <div key={i} className="my-6">
                    {shot ? (
                      <Screenshot src={shot.src} alt={b.alt} url={shot.url} />
                    ) : (
                      <div className="rounded-md border border-dashed border-line bg-ink-950/40 p-6 text-center font-mono text-[11px] text-fog-dim">
                        {b.src}
                      </div>
                    )}
                    {b.caption && (
                      <figcaption className="mt-2.5 text-center font-mono text-[10.5px] italic text-fog-dim">{b.caption}</figcaption>
                    )}
                  </div>
                );
              }
              case "hr":
                return <hr key={i} className="my-8 border-line" />;
              default:
                return null;
            }
          })}
        </div>
      </div>
    </section>
  );
}
