import Nav from "@/components/Nav";
import ScrollFilm from "@/components/ScrollFilm";
import LiveDish from "@/components/LiveDish";
import MenuBoard from "@/components/MenuBoard";
import InteriorBand from "@/components/InteriorBand";
import { DISHES } from "@/lib/menu";
import garden from "@/assets/interior/garden.webp";
import NorenGate from "@/components/NorenGate";
import VisitBlock from "@/components/VisitBlock";
import SiteFooter from "@/components/SiteFooter";
import { LightProvider } from "@/lib/light";

export default function Home() {
  return (
    <>
      <Nav />
      <ScrollFilm />
      <main>
        {DISHES.map((d, i) => (
          <LiveDish
            key={d.id}
            id={d.id}
            label={d.label}
            title={d.title}
            note={d.note}
            text={d.text}
            price={"price" in d ? d.price : undefined}
            video={d.video}
            poster={d.poster}
            flip={i % 2 === 1}
            cup={d.id === "tea"}
          />
        ))}
        <InteriorBand src={garden} alt="Raked gravel zen garden with a paper lamp inside Sabaku" focus="70% 50%">
          <div className="lbl light">お品書き · The menu</div>
          <p className="band-title cap">Slow food,<br />quiet room</p>
        </InteriorBand>
        <MenuBoard />
        <LightProvider>
          <NorenGate>
            <VisitBlock />
          </NorenGate>
          <SiteFooter />
        </LightProvider>
      </main>
    </>
  );
}
