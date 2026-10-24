import { m } from "motion/react";
import { useMemo, useState } from "react";
import { learning, projects, skillGroups } from "../data";
import { reveal } from "../presets";

/**
 * Skills as a match board. Pick a project and the skills it used light up;
 * pick a skill and the projects that used it light up. The links come
 * straight from each project's stack in data.ts, so the board can't claim
 * more than the projects do. Skills not named in a project stay quiet.
 */
type Sel = { kind: "project"; id: string } | { kind: "skill"; name: string } | null;

export default function Skills() {
  const [sel, setSel] = useState<Sel>(null);

  const stackOf = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, new Set(p.stack)])), []);
  const projectsUsing = (skill: string) => projects.filter((p) => stackOf[p.id].has(skill)).map((p) => p.id);

  const onSkills = new Set<string>();
  const onProjects = new Set<string>();
  if (sel?.kind === "project") {
    onProjects.add(sel.id);
    stackOf[sel.id].forEach((s) => onSkills.add(s));
  } else if (sel?.kind === "skill") {
    onSkills.add(sel.name);
    projectsUsing(sel.name).forEach((id) => onProjects.add(id));
  }

  const toggle = (next: NonNullable<Sel>) =>
    setSel((cur) =>
      cur && cur.kind === next.kind && (cur.kind === "project" ? cur.id === (next as { id: string }).id : cur.name === (next as { name: string }).name)
        ? null
        : next,
    );

  let status = "Pick a project or a skill to see how they connect.";
  if (sel?.kind === "project") {
    const p = projects.find((x) => x.id === sel.id)!;
    status = p.stack.length
      ? `${p.title} used ${p.stack.length} of the skills below.`
      : `${p.title} has no stack listed yet.`;
  } else if (sel?.kind === "skill") {
    const n = projectsUsing(sel.name).length;
    status = n
      ? `${sel.name} shows up in ${n} of ${projects.length} projects.`
      : `${sel.name} isn't named in a project card yet. It comes from notebooks and experiments around them.`;
  }

  return (
    <section id="skills" className="py-16 md:py-24" aria-labelledby="skills-title">
      <div className="wrap">
        <m.p className="marker" {...reveal(0)}>
          06 / Toolbox
        </m.p>
        <m.h2 id="skills-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
          What I used, <span className="text-signal">where</span>
        </m.h2>
        <m.p className="mt-4 max-w-xl text-paper-dim" {...reveal(0.1)}>
          Everything here I've actually used. Tap a project or a skill and the board shows how they connect.
        </m.p>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-4">
            <p className="marker mb-3">Projects</p>
            <ul className="space-y-2">
              {projects.map((p) => {
                const on = onProjects.has(p.id);
                const dim = sel && !on;
                return (
                  <m.li key={p.id} {...reveal(0.03)}>
                    <button
                      type="button"
                      aria-pressed={sel?.kind === "project" && sel.id === p.id}
                      onClick={() => toggle({ kind: "project", id: p.id })}
                      className={`board-item flex w-full items-baseline gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                        on ? "border-signal bg-signal/10 text-paper" : "hairline bg-ink-2/50 text-paper-dim hover:border-signal/60"
                      } ${dim ? "opacity-40" : ""}`}
                    >
                      <span className="font-display text-xl text-signal">{p.index}</span>
                      <span className="font-display text-lg leading-tight">{p.title}</span>
                    </button>
                  </m.li>
                );
              })}
            </ul>
          </div>

          <div className="md:col-span-8">
            <div className="space-y-7">
              {skillGroups.map((g) => (
                <m.div key={g.label} {...reveal(0.03)}>
                  <p className="marker mb-3">{g.label}</p>
                  <ul className="flex flex-wrap gap-2">
                    {g.items.map((s) => {
                      const on = onSkills.has(s);
                      const dim = sel && !on;
                      return (
                        <li key={s}>
                          <button
                            type="button"
                            aria-pressed={sel?.kind === "skill" && sel.name === s}
                            onClick={() => toggle({ kind: "skill", name: s })}
                            className={`board-item rounded-full border px-4 py-2 font-display text-lg transition-all duration-300 ${
                              on
                                ? "scale-[1.06] border-signal bg-signal text-ink shadow-[0_0_28px_-4px_rgba(127,214,230,0.7)]"
                                : "hairline bg-ink-2/50 hover:border-signal/60"
                            } ${dim ? "opacity-30" : ""}`}
                          >
                            {s}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </m.div>
              ))}
            </div>
            <p className="mt-8 min-h-[3rem] font-mono text-sm text-signal" role="status" aria-live="polite">
              {status}
            </p>
          </div>
        </div>

        <m.p className="mt-6 max-w-2xl text-paper-dim" {...reveal(0)}>
          <span className="marker mr-3 text-signal">{learning.label}</span>
          {learning.text}
        </m.p>
      </div>
    </section>
  );
}
