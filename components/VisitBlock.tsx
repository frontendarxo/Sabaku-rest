"use client";

import Image from "next/image";
import { PLACE } from "@/lib/menu";
import { useLight } from "@/lib/light";

export default function VisitBlock() {
  const { on, toggle } = useLight();

  return (
    <section className={`visit ${on ? "lit" : "dark"}`} id="visit">
      <div className="v-wrap">
        <div className="v-head">
          <div className="lbl muted">Visit</div>
          <h2 className="cap">Find us in Aljada</h2>
          <span className="ar" lang="ar">
            سباكو
          </span>
          <div className="lamp">
            <button className="lamp-btn" aria-pressed={on} onClick={toggle}>
              <span className="dot" aria-hidden />
              {on ? "Light on" : "Light off"}
            </button>
            <p className="lamp-hint">Or tap the paper lamp on the floor</p>
          </div>
        </div>

        <figure className="facade">
          <Image
            src="/media/film2/m/f_000.webp"
            alt="The Sabaku entrance in Aljada: glowing SABAKU sign above a linen noren"
            width={720}
            height={1088}
            sizes="(max-width: 760px) 100vw, 34vw"
          />
          <span className="glow" aria-hidden />
          <figcaption>Look for the glowing sign</figcaption>
        </figure>

        <dl>
          <div>
            <dt>Address</dt>
            <dd>{PLACE.address}</dd>
          </div>
          <div>
            <dt>Hours</dt>
            <dd>{PLACE.hours}</dd>
          </div>
          <div>
            <dt>Guests say</dt>
            <dd>{PLACE.rating}</dd>
          </div>
          <div>
            <a className="link" href={PLACE.mapsUrl} target="_blank" rel="noopener noreferrer">
              Get directions
            </a>
          </div>
          <p className="status" aria-live="polite">
            {on ? "Lights on — the noren is up until 12 AM." : "Lights off — see you behind the noren tomorrow."}
          </p>
        </dl>
      </div>
    </section>
  );
}
