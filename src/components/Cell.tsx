import { useContext, useMemo } from "react";
import { Location } from "../logic/state";
import "./common.css";
import { GameContext } from "./GameContext";
import classNames from "classnames";

type Props = {
  location: Location;
};

export function Cell({ location }: Props) {
  const { lastWrite, game, selectedCell, setSelectedCell, selectedValue } =
    useContext(GameContext);

  const value = useMemo(() => {
    return game.get(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWrite]);

  const singleAvailableValue = useMemo(() => {
    return !value && game.getAvailableValues(location).length === 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWrite]);

  const sameAsSelectedValue = useMemo(() => {
    return !!value && value === selectedValue;
  }, [value, selectedValue]);

  const intersectsSelectedValue = useMemo(() => {
    return (
      !!selectedValue &&
      (game.getOtherValuesInCol(location).includes(selectedValue) ||
        game.getOtherValuesInRow(location).includes(selectedValue))
    );
  }, [selectedValue, game, location]);

  const isConflicted = useMemo(() => {
    return value && !game.satisfiesAllConstraints(location, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWrite]);

  const isSelected = location.toString() === selectedCell;
  const classes = {
    cell: true,
    highlighted: isSelected,
    "has-value": !!value && !isSelected && !sameAsSelectedValue,
    "single-value": !isSelected && singleAvailableValue,
    "secondary-highlight": !isSelected && sameAsSelectedValue,
    "tertiary-highlight": !isSelected && intersectsSelectedValue,
    conflicted: !isSelected && isConflicted,
  };
  return (
    <div
      className={classNames(classes)}
      onClick={() => setSelectedCell(location.toString())}
    >
      {singleAvailableValue ? game.getAvailableValues(location)[0] : value}
      {isSelected && (
        <input
          className="cell-input"
          type="number"
          pattern="[1-9]"
          maxLength={1}
          autoFocus
          onBlur={() => setSelectedCell(null)}
          value={value ?? ""}
          onChange={(e) => {
            if (e.target.value === "") {
              game.set(location, null);
            } else if (e.target.value.length === 1) {
              try {
                game.set(location, parseInt(e.target.value));
                e.preventDefault();
              } catch (error) {
                console.error(error);
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
            }
          }}
        />
      )}
    </div>
  );
}
