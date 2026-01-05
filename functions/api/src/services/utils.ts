export type Deps = {
  db: typeof import("../db");
  binance: typeof import("../third-party/binance");
};

export const resultData = <T>(data: T) =>
  ({
    data,
    error: null,
  }) as const;

export const resultError = (error: string) => ({
  data: null,
  error,
});

export type Result<T = unknown> =
  | ReturnType<typeof resultData<T>>
  | ReturnType<typeof resultError>;
