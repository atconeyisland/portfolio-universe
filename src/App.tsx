import Starfield from "./Starfield";

export default function App() {
  return (
    <main className="landing">
      <Starfield />
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">Anvi Trivedi</h1>
        <p className="hero__quote">
          “A curious speck of cosmic dust, creating things.”
        </p>
        <span className="scroll-cue" aria-hidden="true">
          scroll to enter <b>↓</b>
        </span>
      </section>
    </main>
  );  
}
