import type { ReactNode } from "react";

/** Shared art for the Windows PC and Android phone, used by the film and the live demo. */

export const WinArrow = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <path d="M3 2v15l4.2-3.6 2.6 5.6 2.6-1.2-2.6-5.5H15z" fill="#fff" stroke="#000" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);
export const AndroidPtr = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
    <circle cx="15" cy="15" r="12" fill="rgba(255,255,255,0.22)" stroke="#fff" strokeWidth="1.6" />
    <circle cx="15" cy="15" r="4.2" fill="#fff" />
  </svg>
);

export function Caret({ on = true }: { on?: boolean }) {
  return on ? <span className="ms-caret" aria-hidden="true" /> : null;
}

/** Everything inside a Windows screen: wallpaper, Notepad, taskbar. `children` sit on top (cursors). */
export function WinScreenInner({ text, caret = true, children }: { text: ReactNode; caret?: boolean; children?: ReactNode }) {
  return (
    <>
      <div className="ms-win-bloom" aria-hidden="true" />
      <div className="ms-notepad">
        <div className="ms-np-title">
          <span>Untitled - Notepad</span>
          <span className="ms-np-ctl" aria-hidden="true">
            <i>&#8211;</i>
            <i>&#9633;</i>
            <i>&#10005;</i>
          </span>
        </div>
        <div className="ms-np-menu" aria-hidden="true">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
        </div>
        <div className="ms-np-text">
          {text}
          <Caret on={caret} />
        </div>
      </div>
      <div className="ms-taskbar" aria-hidden="true">
        <span className="ms-tb-left" />
        <span className="ms-tb-center">
          <svg viewBox="0 0 16 16" width="1em" height="1em">
            <path fill="#4cc2ff" d="M1 2.4 7 1.5v5.6H1zM8 1.4l7-1v6.7H8zM1 8h6v5.6l-6-.9zM8 8h7v6.6l-7-1z" />
          </svg>
          <span className="ms-tb-search" />
          <span className="ms-tb-dot" style={{ background: "#f5a623" }} />
          <span className="ms-tb-dot" style={{ background: "#3ecf8e" }} />
          <span className="ms-tb-dot" style={{ background: "#7fd6e6" }} />
        </span>
        <span className="ms-tb-right">
          <span>10:42</span>
          <span>23-10-2026</span>
        </span>
      </div>
      {children}
    </>
  );
}

/** Everything inside an Android screen: punch-hole camera, status bar, note app, 3-button nav. */
export function PhoneScreenInner({ text, caret = true, children }: { text: ReactNode; caret?: boolean; children?: ReactNode }) {
  return (
    <>
      <span className="ms-hole" aria-hidden="true" />
      <div className="ms-status" aria-hidden="true">
        <span>10:42</span>
        <span className="ms-status-ic">
          <svg viewBox="0 0 16 12" width="1.2em" height="1em">
            <path fill="#e6e1e5" d="M8 11 .5 3.2a10.6 10.6 0 0 1 15 0z" />
          </svg>
          <svg viewBox="0 0 10 14" width="0.7em" height="1em">
            <rect x="1" y="2" width="8" height="11" rx="1.6" fill="#e6e1e5" />
            <rect x="3.5" y="0" width="3" height="2" fill="#e6e1e5" />
          </svg>
        </span>
      </div>
      <div className="ms-appbar" aria-hidden="true">
        <span>&#8592;</span>
        <span className="ms-appbar-title">Note</span>
        <span className="ms-appbar-dots">&#8942;</span>
      </div>
      <div className="ms-note">
        <div className="ms-note-title" aria-hidden="true">Typed from my PC</div>
        <div className="ms-note-text">
          {text}
          <Caret on={caret} />
        </div>
      </div>
      <div className="ms-nav" aria-hidden="true">
        <svg viewBox="0 0 14 14" width="1em" height="1em">
          <path d="M11 2 3 7l8 5z" fill="#e6e1e5" />
        </svg>
        <svg viewBox="0 0 14 14" width="1em" height="1em">
          <circle cx="7" cy="7" r="5" fill="none" stroke="#e6e1e5" strokeWidth="1.8" />
        </svg>
        <svg viewBox="0 0 14 14" width="1em" height="1em">
          <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill="none" stroke="#e6e1e5" strokeWidth="1.8" />
        </svg>
      </div>
      {children}
    </>
  );
}
