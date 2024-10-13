import { createContext, useRef, useState } from "react";
import { LocationString, Location, Game } from "../logic/state";

export const GameContext = createContext<{
  selectedCell: LocationString | null;
  selectedValue: number | null;
  setSelectedCell: (location: LocationString | null) => void;
  game: Game;
  lastWrite: number;
}>({
  selectedCell: null,
  selectedValue: null,
  setSelectedCell: () => {},
  game: new Game(),
  lastWrite: 0,
});

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedCell, setSelectedCell] = useState<LocationString | null>(null);
  const [lastWrite, setLastWrite] = useState(0);

  const gameRef = useRef<Game>(null);
  if (gameRef.current === null) {
    gameRef.current = new Game(() => setLastWrite(Date.now()));
  }

  const selectedValue = selectedCell
    ? gameRef.current.get(Location.fromString(selectedCell))
    : null;

  return (
    <GameContext.Provider
      value={{
        selectedCell,
        selectedValue,
        setSelectedCell,
        game: gameRef.current,
        lastWrite,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
