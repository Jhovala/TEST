import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer" id="contacto">
      <p>
        Hecho con React + Canvas API · técnica inspirada en{' '}
        <a href="https://www.scrolltide.co/templates/scowlby" rel="noreferrer noopener" target="_blank">
          Scrolltide Scowlby
        </a>
      </p>
      <p className="site-footer__meta">© {new Date().getFullYear()} sparky.ai — demo educativa</p>
    </footer>
  );
}
