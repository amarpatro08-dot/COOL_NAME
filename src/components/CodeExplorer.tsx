import { useMemo, useState } from "react";
import { PYTHON_FILES, buildTree, type TreeNode } from "../data/python";
import { Chip, Icon, Kicker, SectionTitle, useReveal } from "../lib/ui";
import { Highlight } from "./Highlight";

const LANG_TONE: Record<string, string> = {
  python: "bg-cy",
  yaml: "bg-warn",
  toml: "bg-sim",
  bash: "bg-pass",
  markdown: "bg-fog",
};

function TreeLevel({
  nodes, depth, selected, onSelect, open, toggle,
}: {
  nodes: TreeNode[];
  depth: number;
  selected: string;
  onSelect: (path: string) => void;
  open: Record<string, boolean>;
  toggle: (path: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((n) =>
        n.children ? (
          <li key={n.path}>
            <button
              onClick={() => toggle(n.path)}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1 font-mono text-[11.5px] text-fog transition-colors hover:bg-ink-800 hover:text-paper"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <Icon name="chev" size={10} className={`transition-transform duration-200 ${open[n.path] ? "rotate-90" : ""}`} />
              <span className="text-fog">{n.name}/</span>
            </button>
            {open[n.path] && (
              <TreeLevel nodes={n.children} depth={depth + 1} selected={selected} onSelect={onSelect} open={open} toggle={toggle} />
            )}
          </li>
        ) : (
          <li key={n.path}>
            <button
              onClick={() => onSelect(n.path)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 font-mono text-[11.5px] transition-colors ${
                selected === n.path ? "bg-cy/10 text-cy" : "text-fog hover:bg-ink-800 hover:text-paper"
              }`}
              style={{ paddingLeft: `${depth * 12 + 22}px` }}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${LANG_TONE[n.file?.lang ?? "python"]}`} />
              <span className="truncate">{n.name}</span>
            </button>
          </li>
        ),
      )}
    </ul>
  );
}

export function CodeExplorer() {
  const ref = useReveal<HTMLDivElement>();
  const tree = useMemo(() => buildTree(), []);
  const [selected, setSelected] = useState("src/nettest/devices/simulated_switch.py");
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    for (const f of PYTHON_FILES) {
      const parts = f.path.split("/").slice(0, -1);
      let acc = "";
      for (const p of parts) {
        acc = acc ? `${acc}/${p}` : p;
        o[acc] = true;
      }
    }
    return o;
  });
  const [copied, setCopied] = useState(false);

  const file = PYTHON_FILES.find((f) => f.path === selected) ?? PYTHON_FILES[0];
  const totalLines = useMemo(() => PYTHON_FILES.reduce((s, f) => s + f.code.split("\n").length, 0), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* non-fatal */
    }
  };

  return (
    <section id="code" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8" ref={ref}>
      <div className="reveal flex flex-wrap items-end justify-between gap-6">
        <div>
          <Kicker index="03">the repository</Kicker>
          <SectionTitle
            sub={`Every file CI executes, readable in full: typed Python, YAML configuration, the pytest suites and the Actions workflow. ${PYTHON_FILES.length} files · ${totalLines.toLocaleString()} lines — open any of them.`}
          >
            Read the source,
            <br />
            not the brochure.
          </SectionTitle>
        </div>
        <div className="flex gap-2 pb-1">
          <Chip tone="cy">{PYTHON_FILES.length} files</Chip>
          <Chip tone="pass">ruff · mypy strict</Chip>
          <Chip tone="fog">MIT</Chip>
        </div>
      </div>

      <div className="reveal reveal-d1 mt-10 grid overflow-hidden rounded-lg border border-line bg-ink-900/80 lg:grid-cols-[280px_1fr]">
        {/* tree */}
        <div className="border-b border-line bg-ink-950/50 p-3 lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center gap-2 px-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog-dim">
            <Icon name="box" size={12} /> network-test-automation/
          </div>
          <div className="code-scroll max-h-[260px] overflow-y-auto lg:max-h-[560px]">
            <TreeLevel
              nodes={tree}
              depth={0}
              selected={selected}
              onSelect={setSelected}
              open={open}
              toggle={(p) => setOpen((o) => ({ ...o, [p]: !o[p] }))}
            />
          </div>
        </div>

        {/* viewer */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-ink-850 px-4 py-2.5">
            <span className="font-mono text-[11.5px] text-cy">{file.path}</span>
            <Chip tone="fog">{file.lang}</Chip>
            <span className="hidden font-mono text-[10.5px] text-fog-dim md:inline">{file.purpose}</span>
            <button
              onClick={copy}
              className={`ml-auto flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[10.5px] transition-all duration-200 ${
                copied ? "border-pass/50 text-pass" : "border-line text-fog hover:border-cy/50 hover:text-cy"
              }`}
            >
              <Icon name={copied ? "check" : "copy"} size={11} /> {copied ? "copied" : "copy"}
            </button>
          </div>
          <div className="code-scroll max-h-[560px] overflow-auto bg-ink-950/60 py-3">
            <Highlight key={file.path} code={file.code} lang={file.lang} />
          </div>
        </div>
      </div>
    </section>
  );
}
