import { useEffect } from "react";
import { usePlayerStore } from "../stores/usePlayerStore";

let init = false;

export const usePlayer = () => {
  const player = usePlayerStore((s) => s.player);
  const getPlayer = usePlayerStore((s) => s.fetchPlayer);

  useEffect(() => {
    if (!init && getPlayer) {
      getPlayer();
      init = true;
    }
  }, [getPlayer]);

  return player;
};
