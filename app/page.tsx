import Game from "./Game";
import BgmController from "./bgm/BgmController";

export default function Home() {
  return (
    <BgmController>
      <Game />
    </BgmController>
  );
}
