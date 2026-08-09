import Game from "./Game";
import BgmController from "./bgm/BgmController";
import OpeningGate from "./opening/OpeningGate";
import "./combat-focus.css";

export default function Home() {
  return (
    <OpeningGate>
      <BgmController>
        <Game />
      </BgmController>
    </OpeningGate>
  );
}
