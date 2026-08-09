import Game from "./Game";
import BgmController from "./bgm/BgmController";
import "./combat-focus.css";

export default function Home() {
  return (
    <BgmController>
      <Game />
    </BgmController>
  );
}
