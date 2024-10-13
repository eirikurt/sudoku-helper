import "./common.css";
import { Block } from "./Block";
import { useContext, useEffect, useRef } from "react";
import { GameContext } from "./GameContext";
import { useClickOutside } from "../hooks/useClickOutside";
import { Location } from "../logic/state";

export function Board() {
  // TODO: reset/clear button
  const ref = useRef<HTMLDivElement>(null);
  const { game, selectedCell, setSelectedCell } = useContext(GameContext);
  useClickOutside(ref, () => setSelectedCell(null));
  useEffect(() => {
    function keyDownHandler(event: KeyboardEvent) {
      if (selectedCell) {
        const location = Location.fromString(selectedCell);
        // TODO: arrow keys to move selection
        const numberString = "123456789";
        if (numberString.includes(event.key)) {
          game.set(location, parseInt(event.key));
        } else if (event.key === "Backspace") {
          game.set(location, null);
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
      <input
        type="button"
        className="clear-button"
        value="Clear"
        onClick={() => game.clear()}
      />
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
