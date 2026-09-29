import BotCanvas from '../../atoms/BotCanvas/BotCanvas';
import './HeroSection.css';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero__copy">
        <span className="hero__eyebrow">// tu copiloto con personalidad</span>
        <h1 className="hero__title">
          Hola, soy <em>Sparky</em>.<br />
          Te sigo a donde muevas el cursor.
        </h1>
        <p className="hero__subtitle">
          Landing interactiva inspirada en la técnica de Scrolltide: una secuencia de
          fotogramas pre-renderizados del bot dibujados sobre un canvas HTML5 — sin WebGL,
          sin GPU dedicada, 60&nbsp;fps garantizados.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#contacto">
            Hablemos
          </a>
          <a className="btn btn--ghost" href="#tecnica">
            Cómo funciona
          </a>
        </div>
      </div>
      <div className="hero__bot" aria-hidden={false}>
        <BotCanvas totalFrames={90} columns={10} basePath="/bot-sequence" easing={0.2} />
      </div>
    </section>
  );
}
