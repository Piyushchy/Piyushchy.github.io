import Hero from "./components/Hero";
import Nav from "./components/Nav";
import Projects from "./components/Projects";
import { About, Contact, Experience, Footer, Skills } from "./components/Sections";
import { useReveal } from "./hooks";

export default function App() {
  useReveal();
  return (
    <>
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
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
