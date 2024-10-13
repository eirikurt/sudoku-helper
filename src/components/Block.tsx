import "./common.css";

import { Cell } from "./Cell";
import { Location } from "../logic/state";

type Props = {
  blockCol: number;
  blockRow: number;
};

export function Block({ blockCol, blockRow }: Props) {
  const oneTwoThree = [1, 2, 3] as const;
  return (
    <div className="block">
      {oneTwoThree.map((row) => (
        <div className="row" key={`block-row-${blockCol}-${blockRow}-${row}`}>
          {oneTwoThree.map((col) => (
            <Cell
              location={
                new Location((blockCol - 1) * 3 + col, (blockRow - 1) * 3 + row)
              }
              key={`block-cell-${blockCol}-${blockRow}-${row}-${col}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
