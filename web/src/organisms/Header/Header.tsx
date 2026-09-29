import './Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <a href="#" className="site-header__logo" aria-label="Sparky AI — inicio">
        ⬢ sparky<span>.ai</span>
      </a>
      <nav className="site-header__nav" aria-label="Principal">
        <a href="#tecnica">Técnica</a>
        <a href="#pipeline">Pipeline 3D</a>
        <a href="#contacto" className="site-header__cta">
          Contacto
        </a>
      </nav>
    </header>
  );
}
