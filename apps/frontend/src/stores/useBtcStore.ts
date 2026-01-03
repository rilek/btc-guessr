import { create } from "zustand";
import { fetchBtcPrice } from "../api";

type BtcState = {
  price: number | null;
  fetchPrice: () => Promise<void>;
};

export const useBtcStore = create<BtcState>()((set) => ({
  price: null,
  fetchPrice: async () => {
    const price = await fetchBtcPrice();
    set({ price });
  },
}));
