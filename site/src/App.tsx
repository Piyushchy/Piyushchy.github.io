import Activity from "./components/Activity";
import Nav from "./components/Nav";
import Story from "./components/Story";
import Showcase from "./components/Showcase";
import MouseShareDemo from "./components/MouseShareDemo";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import { About, Contact, Experience, Footer } from "./components/Sections";
import { useEffect } from "react";
import { MotionRoot } from "./motion";

export default function App() {
  useEffect(() => {
    const onVis = () => document.body.classList.toggle("paused", document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return (
    <MotionRoot>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-signal focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <div className="page-grain" aria-hidden="true" />
      <div className="page-grid" aria-hidden="true" />
      <Nav />
      <main id="main">
        <Story />
        <About />
        <Showcase />
        <MouseShareDemo />
        <Projects />
        <Activity />
        <Skills />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </MotionRoot>
  );
}
