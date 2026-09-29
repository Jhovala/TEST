import Header from './organisms/Header/Header';
import HeroSection from './molecules/HeroSection/HeroSection';
import Footer from './organisms/Footer/Footer';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <section className="section" id="tecnica">
          <h2>La técnica, en 4 pilares</h2>
          <div className="cards">
            <article className="card">
              <h3>1 · Precarga</h3>
              <p>
                Todos los fotogramas WebP entran a memoria antes de arrancar el bucle:
                cero parpadeos ni huecos blancos.
              </p>
            </article>
            <article className="card">
              <h3>2 · Mapeo de coordenadas</h3>
              <p>
                La posición (x, y) del cursor se normaliza y proyecta sobre una rejilla
                de 10×9 ángulos de mirada → índice de frame [0…89].
              </p>
            </article>
            <article className="card">
              <h3>3 · Render loop</h3>
              <p>
                requestAnimationFrame dibuja el frame activo con inercia (lerp 0.2),
                dando sensación de peso sin sacrificar fps.
              </p>
            </article>
            <article className="card">
              <h3>4 · Idle state</h3>
              <p>
                Sin movimiento durante 3 s, Sparky entra en reposo: barrido senoidal
                sutil que lo hace sentir vivo.
              </p>
            </article>
          </div>
        </section>
        <section className="section" id="pipeline">
          <h2>Pipeline 3D (Blender → WebP)</h2>
          <ol className="steps">
            <li>Modelar el bot con rigging de mirada: Empty <code>Target_Look</code> + restricción <em>Track To</em> en cabeza/ojos.</li>
            <li>Desplazar <code>Target_Look</code> en una cuadrícula virtual (arco de visión) y renderizar 60–100 frames PNG 800×800 con transparencia.</li>
            <li>Optimizar: <code>cwebp -q 80 frame.png -o frame.webp</code> → <code>public/bot-sequence/frame-00.webp … frame-89.webp</code></li>
            <li>(Opcional) Consolidar en un sprite sheet para 1 sola petición HTTP.</li>
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
