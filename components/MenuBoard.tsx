"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { MENU } from "@/lib/menu";
import { CupIcon } from "./LiveDish";

const CATS = Object.keys(MENU);

export default function MenuBoard() {
  const [sel, setSel] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (sel + (e.key === "ArrowRight" ? 1 : CATS.length - 1)) % CATS.length;
    setSel(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="menu" id="menu">
      <div className="board">
        <div className="board-head">
          <h2 className="cap">Menu</h2>
          <span className="lbl">Prices in AED</span>
        </div>
        <div className="tabs" role="tablist" aria-label="Menu categories" onKeyDown={onKey}>
          {CATS.map((c, i) => (
            <button
              key={c}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              className="tab"
              role="tab"
              id={`mt${i}`}
              aria-selected={i === sel}
              aria-controls="menu-list"
              tabIndex={i === sel ? 0 : -1}
              onClick={() => setSel(i)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="list" id="menu-list" role="tabpanel" aria-labelledby={`mt${sel}`} key={sel}>
          {MENU[CATS[sel]].map((item, i) => (
            <div className="row" key={item.name} style={{ animationDelay: `${i * 35}ms` }}>
              {item.photo ? (
                <img src={item.photo} alt="" loading="lazy" width={56} height={56} />
              ) : (
                <span className="ph">
                  <CupIcon width={30} />
                </span>
              )}
              <div>
                <h3 className="cap">{item.name}</h3>
                {item.note && <p className="it">{item.note}</p>}
              </div>
              <b>{item.price}</b>
            </div>
          ))}
        </div>
        <p className="fine">
          Items and prices transcribed from Sabaku’s in-store menu board; they may change. Photos are restyled from guest
          photos.
        </p>
      </div>
    </section>
  );
}
