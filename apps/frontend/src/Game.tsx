import btcLogo from "/btc-logo.svg";
import { usePlayer } from "./hooks/usePlayer";
import { useWatchBtcPrice } from "./hooks/useWatchBtcPrice";
import { useBtcStore } from "./stores/useBtcStore";
import { usePlayerStore } from "./stores/usePlayerStore";
import { Button } from "./ui/Button";
import { useWatchPendingGuess } from "./hooks/useWatchPendingGuess";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatPrice = (price: number) => currencyFormatter.format(price);

const formatDate = (date = new Date()) => {
  return date.toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const Game = () => {
  const price = useBtcStore((s) => s.price);
  const player = usePlayerStore((s) => s.player);
  const score = usePlayerStore((s) => s.getScore)();
  const canPlay = usePlayerStore((s) => s.canPlay)();
  const pendingGuess = usePlayerStore((s) => s.getPendingGuess)();

  const makeGuess = usePlayerStore((s) => s.makeGuess);

  usePlayer();
  useWatchBtcPrice();
  useWatchPendingGuess();

  return (
    <div className="flex flex-col gap-8 w-2xl">
      <header>
        <div className="flex justify-center">
          <img src={btcLogo} className="logo" alt="Vite logo" />
        </div>
        <h1 className="text-4xl font-bold">BTC Guessr</h1>
      </header>

      <div className=" flex items-center justify-center mx-auto h-40 w-lg bg-black/50 rounded-xl text-4xl font-bold tabular-nums">
        {price ? formatPrice(price) : "Loading..."}
      </div>

      <h2 className="text-2xl">Will the BTC price go up or down?</h2>
      <div className="flex flex-col gap-8">
        <div className="flex gap-2 justify-center">
          <Button
            disabled={!canPlay}
            onClick={() => makeGuess("up")}
            className="w-52 bg-green-700"
          >
            UP
          </Button>
          <Button
            disabled={!canPlay}
            onClick={() => makeGuess("down")}
            className="w-52  bg-red-700"
          >
            DOWN
          </Button>
        </div>
        <div>
          {pendingGuess && (
            <div className="flex flex-col gap-2">
              <p className="text-xl">
                You guess that BTC will go{" "}
                <span className="font-bold">
                  {pendingGuess.direction.toUpperCase()}
                </span>{" "}
                from{" "}
                <span className="font-bold">
                  {formatPrice(pendingGuess.referencePrice)}
                </span>
                .
              </p>
              <p>
                {" "}
                The guess was made at{" "}
                {formatDate(new Date(pendingGuess.createdAt))} will be resolved
                after{" "}
                {formatDate(
                  new Date(new Date(pendingGuess.createdAt).getTime() + 60000),
                )}
              </p>
            </div>
          )}
        </div>
        <div>
          <p>You've guessed {score} times so far.</p>
        </div>
        {player && (
          <div>
            <h3 className="font-bold text-lg">Guesses history:</h3>
            <ul className="space-y-2">
              {player?.guesses
                .slice()
                .reverse()
                .map((g) => (
                  <li key={g.guessId}>
                    <p>
                      [{formatDate(new Date(g.createdAt))}]:{" "}
                      <span className="font-bold">
                        {g.direction.toUpperCase()}
                      </span>{" "}
                      from{" "}
                      <span className="font-bold">
                        {formatPrice(g.referencePrice)}
                      </span>
                      {g.status === "resolved" && (
                        <>
                          :{" "}
                          <span className="font-bold">
                            {g.outcome.toUpperCase()}
                          </span>
                        </>
                      )}
                    </p>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
