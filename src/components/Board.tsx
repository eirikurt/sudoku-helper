import "./common.css";
import { Block } from "./Block";
import { useContext, useEffect, useRef } from "react";
import { GameContext } from "./GameContext";
import { useClickOutside } from "../hooks/useClickOutside";
import { Location } from "../logic/state";
import { safeBets } from "../logic/solvers";

type ArrowKeys = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";
const arrowKeyModifiers: Record<ArrowKeys, Location> = {
  ArrowLeft: new Location(-1, 0),
  ArrowRight: new Location(1, 0),
  ArrowUp: new Location(0, -1),
  ArrowDown: new Location(0, 1),
};

export function Board() {
  // TODO: undo/redo
  const ref = useRef<HTMLDivElement>(null);
  const { game, selectedCell, setSelectedCell } = useContext(GameContext);
  useClickOutside(ref, () => setSelectedCell(null));
  useEffect(() => {
    function keyDownHandler(event: KeyboardEvent) {
      if (selectedCell) {
        const location = Location.fromString(selectedCell);
        const numberString = "123456789";
        if (numberString.includes(event.key)) {
          game.set(location, parseInt(event.key));
        } else if (event.key === "Backspace") {
          game.set(location, null);
        } else if (event.key === "Escape") {
          setSelectedCell(null);
        } else if (event.key in arrowKeyModifiers) {
          const modification = arrowKeyModifiers[event.key as ArrowKeys];
          const currentLocation = Location.fromString(selectedCell);
          const newLocation = new Location(
            currentLocation.col + modification.col,
            currentLocation.row + modification.row
          );
          if (newLocation.isValid) {
            setSelectedCell(newLocation.toString());
          }
        }
      }
    }
    document.addEventListener("keydown", keyDownHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  });

  const oneTwoThree = [1, 2, 3] as const;

  return (
    <>
      <button onClick={() => game.clear()}>Clear</button>
      <button onClick={() => safeBets(game)}>Solve</button>
      <div className="board" ref={ref}>
        {oneTwoThree.map((row) => (
          <div className="row" key={`board-row-${row}`}>
            {oneTwoThree.map((col) => (
              <Block
                blockCol={col}
                blockRow={row}
                key={`board-block-${row}-${col}`}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
