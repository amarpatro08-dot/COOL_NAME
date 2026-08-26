import { IconBolt } from "./Icons";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-ink bg-ink text-paper">
      <div className="hazard h-2 w-full" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="font-display text-7xl leading-[0.9] tracking-tight sm:text-8xl lg:text-9xl">
            DO IT<span className="text-verm">.</span>
          </p>
          <p className="mt-5 max-w-sm font-mono text-xs leading-relaxed tracking-[0.12em] text-paper/60">
            THE WORK DOESN'T CARE HOW YOU FEEL ABOUT IT. QUEUE IT, CLOCK IT, SHIP IT —
            THEN DO THE NEXT ONE.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 lg:col-span-5">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold tracking-[0.24em] text-sun">
              SECTIONS
            </p>
            <ul className="space-y-2.5 font-mono text-sm">
              <li>
                <a href="#now-dock" className="group inline-flex items-center gap-2 text-paper/80 transition-colors hover:text-verm">
                  <span className="h-0.5 w-3 bg-verm transition-all group-hover:w-5" /> THE NOW DOCK
                </a>
              </li>
              <li>
                <a href="#queue" className="group inline-flex items-center gap-2 text-paper/80 transition-colors hover:text-verm">
                  <span className="h-0.5 w-3 bg-verm transition-all group-hover:w-5" /> THE QUEUE
                </a>
              </li>
              <li>
                <a href="#record" className="group inline-flex items-center gap-2 text-paper/80 transition-colors hover:text-verm">
                  <span className="h-0.5 w-3 bg-verm transition-all group-hover:w-5" /> THE RECORD
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold tracking-[0.24em] text-sun">
              SHORTCUTS
            </p>
            <ul className="space-y-2.5 font-mono text-xs text-paper/70">
              <li>
                <kbd className="border border-paper/40 bg-ink px-1.5 py-0.5 font-bold text-paper">/</kbd>{" "}
                GRAB THE INPUT
              </li>
              <li>
                <kbd className="border border-paper/40 bg-ink px-1.5 py-0.5 font-bold text-paper">↵</kbd>{" "}
                QUEUE THE THING
              </li>
              <li className="pt-2 text-paper/40">
                DATA LIVES IN YOUR BROWSER.
                <br />
                THE LIST NEVER LEAVES THE MACHINE.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-paper/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 font-mono text-[10px] tracking-[0.2em] text-paper/40 sm:px-6">
          <span className="flex items-center gap-2">
            <IconBolt width={12} height={12} className="text-verm" /> DO/IT — EXECUTION BOARD,
            EST. TODAY
          </span>
          <span>NO EXCUSES STORED. THEY ALL GET SHREDDED.</span>
        </div>
      </div>
    </footer>
  );
}
