import Game from "./Game";
import BgmController from "./bgm/BgmController";
import EndingGate from "./ending/EndingGate";
import OpeningGate from "./opening/OpeningGate";
import "./combat-focus.css";

export default function Home() {
  return (
    <OpeningGate>
      <EndingGate>
        <BgmController>
          <Game />
        </BgmController>
      </EndingGate>
    </OpeningGate>
  );
}
