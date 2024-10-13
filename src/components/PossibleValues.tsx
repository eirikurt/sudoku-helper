import { useContext } from "react";
import { GameContext } from "./GameContext";
import { Location } from "../logic/state";

export function PossibleValues() {
  const { game, selectedCell } = useContext(GameContext);

  if (!selectedCell) {
    return null;
  }
  const location = Location.fromString(selectedCell);
  const cellValue = game.get(location);
  if (cellValue) {
    return null;
  }

  const possibleValues = game.getAvailableValues(location);
  return (
    <div className="possible-values">
      <div className="title">Possible values: </div>
      {possibleValues.map((value) => (
        <div key={`possible-value-${value}`}>{value}</div>
      ))}
    </div>
  );
}
