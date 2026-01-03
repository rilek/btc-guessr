import { useEffect } from "react";
import { usePlayerStore } from "../stores/usePlayerStore";

let timeoutNo: number | null = null;

export const useWatchPendingGuess = () => {
  const pendingGuess = usePlayerStore((s) => s.getPendingGuess)();
  const resolveGuess = usePlayerStore((s) => s.resolveGuess);

  useEffect(() => {
    if (!timeoutNo && !!pendingGuess) {
      const timeLeft = Math.max(
        new Date(pendingGuess.createdAt).getTime() + 60001 - Date.now(),
        0,
      );

      timeoutNo = setTimeout(() => {
        resolveGuess();
      }, timeLeft);

      return () => {
        if (timeoutNo) {
          clearTimeout(timeoutNo);
        }
      };
    }
  }, [pendingGuess, resolveGuess]);

  return !!pendingGuess;
};
