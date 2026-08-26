import { useMemo } from "react";

interface Token {
  text: string;
  cls: string;
}

const PY_KW =
  "def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|finally|raise|lambda|yield|pass|break|continue|assert|match|case|type";

function tokenizePython(line: string): Token[] {
  const re = new RegExp(
    `(#.*$)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|(@[\\w.]+)|\\b(${PY_KW})\\b|(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)|(\\b[A-Za-z_][\\w.]*(?=\\())|(\\b[A-Z][A-Za-z_0-9]{2,}\\b)`,
    "g",
  );
  return splitWith(line, re, ["tok-com", "tok-str", "tok-dec", "tok-kw", "tok-num", "tok-fn", "tok-cls"]);
}

function tokenizeYaml(line: string): Token[] {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|^(\s*[\w./-]+(?=:))|(\b(?:true|false|null)\b)|(-?\b\d[\d._]*\b)/g;
  return splitWith(line, re, ["tok-com", "tok-str", "tok-key", "tok-kw", "tok-num"]);
}

function tokenizeToml(line: string): Token[] {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|^(\[[^\]]+\])|^(\s*[\w-]+(?=\s*=))|(\b\d[\d._]*\b)/g;
  return splitWith(line, re, ["tok-com", "tok-str", "tok-cls", "tok-key", "tok-num"]);
}

function tokenizeBash(line: string): Token[] {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|(\$\{?[\w@]+\}?)|\b(if|then|fi|for|do|done|set|source|export|echo|local)\b/g;
  return splitWith(line, re, ["tok-com", "tok-str", "tok-dec", "tok-kw"]);
}

function splitWith(line: string, re: RegExp, classes: string[]): Token[] {
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), cls: "" });
    let cls = "";
    for (let g = 1; g < m.length; g++) {
      if (m[g] !== undefined) {
        cls = classes[g - 1];
        break;
      }
    }
    out.push({ text: m[0], cls });
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (last < line.length) out.push({ text: line.slice(last), cls: "" });
  return out;
}

export function Highlight({ code, lang }: { code: string; lang: string }) {
  const lines = useMemo(() => {
    const tok =
      lang === "python"
        ? tokenizePython
        : lang === "yaml"
          ? tokenizeYaml
          : lang === "toml"
            ? tokenizeToml
            : lang === "bash"
              ? tokenizeBash
              : null;
    return code.split("\n").map((line) => (tok ? tok(line) : [{ text: line, cls: "" }]));
  }, [code, lang]);

  return (
    <pre className="font-mono text-[12.5px] leading-[1.62] text-paper/90">
      {lines.map((tokens, i) => (
        <div key={i} className="flex hover:bg-cy/[0.04]">
          <span className="w-10 shrink-0 select-none pr-4 text-right text-fog-dim/60">{i + 1}</span>
          <span className="whitespace-pre pr-6">
            {tokens.map((t, j) =>
              t.cls ? (
                <span key={j} className={t.cls}>
                  {t.text}
                </span>
              ) : (
                <span key={j}>{t.text}</span>
              ),
            )}
            {tokens.length === 0 && " "}
          </span>
        </div>
      ))}
    </pre>
  );
}
