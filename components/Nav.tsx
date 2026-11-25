"use client";

import { useEffect, useState } from "react";

/** White over the film, solid ink-on-linen once the film has scrolled past. */
export default function Nav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const film = document.getElementById("top");
    if (!film) return;
    const update = () => setSolid(film.getBoundingClientRect().bottom < 70);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`nav${solid ? " solid" : ""}`}>
      <a className="mark" href="#top" aria-label="Sabaku home">
        <b>SABAKU</b>
        <span className="ar" lang="ar">
          سباكو
        </span>
      </a>
      <nav>
        <a href="#pancakes">Dishes</a>
        <a href="#menu">Menu</a>
        <a href="#visit">Visit</a>
      </nav>
    </header>
  );
}
