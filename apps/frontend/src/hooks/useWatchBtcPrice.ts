import { useEffect } from "react";
import { useBtcStore } from "../stores/useBtcStore";

let watchIntervalNo: number | null = null;

export const useWatchBtcPrice = () => {
  const price = useBtcStore((s) => s.price);
  const fetchPrice = useBtcStore((s) => s.fetchPrice);

  useEffect(() => {
    if (!watchIntervalNo) {
      fetchPrice();

      watchIntervalNo = setInterval(() => {
        fetchPrice();
      }, 5000);

      return () => {
        if (watchIntervalNo) {
          clearInterval(watchIntervalNo);
          watchIntervalNo = null;
        }
      };
    }
  }, [fetchPrice]);

  return price;
};
