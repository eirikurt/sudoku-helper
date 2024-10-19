export type LocationString = `${number}-${number}`;

export class Location {
  constructor(readonly col: number, readonly row: number) {}

  static fromString(str: LocationString): Location {
    const [col, row] = str.split("-").map(Number);
    return new Location(col, row);
  }

  toString(): LocationString {
    return `${this.col}-${this.row}`;
  }

  equals(other: Location) {
    return this.col === other.col && this.row === other.row;
  }

  get block(): Location {
    return new Location(
      Math.floor((this.col - 1) / 3) + 1,
      Math.floor((this.row - 1) / 3) + 1
    );
  }

  get isValid(): boolean {
    return this.col >= 1 && this.col <= 9 && this.row >= 1 && this.row <= 9;
  }
}

type constraintChecker = (
  game: Game,
  location: Location,
  value: number
) => number;

const checkers: constraintChecker[] = [
  numSameValueInBlock,
  numSameValueInRow,
  numSameValueInCol,
];

export class Game {
  private values: (number | null)[] = new Array(9 * 9).fill(null);
  private availableValues: number[][] = new Array(9 * 9).fill([]);
  private onChange?: (location: Location) => void;
  private localStorageKey = "sudoku" as const;

  public constructor(onChange?: (location: Location) => void) {
    this.onChange = onChange;
    const savedValues = localStorage.getItem(this.localStorageKey);
    if (savedValues) {
      try {
        this.values = JSON.parse(savedValues);
      } catch (error) {
        console.error("Failed to load saved values", error);
      }
    }
    this.updateAvailableValues();
  }

  public clear() {
    this.values = new Array(9 * 9).fill(null);
    localStorage.removeItem(this.localStorageKey);
    this.updateAvailableValues();
    this.onChange?.(new Location(1, 1));
  }

  public set(location: Location, value: number | null) {
    this.values[this.toIndex(location)] = value;
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.values));
    this.updateAvailableValues();
    this.onChange?.(location);
  }

  public get(location: Location) {
    return this.values[this.toIndex(location)];
  }

  private updateAvailableValues() {
    this.availableValues = new Array(9 * 9).fill([]);
    // Prime the available values, leaving ones that don't violate any constraints
    this.visitAll((location) => {
      const value = this.get(location);
      if (value) {
        this.availableValues[this.toIndex(location)] = [];
      } else {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.availableValues[this.toIndex(location)] = values.filter((value) =>
          this.satisfiesAllConstraints(location, value)
        );
      }
    });

    this.clamping();

    let allSettled = false;
    while (!allSettled) {
      allSettled = true;
      this.visitAll((location) => {
        if (this.get(location)) {
          return;
        }
        const availableValues = this.getAvailableValues(location);
        if (availableValues.length < 2) {
          return;
        }
        const blockLocations = this.getLocationsInBlock(location);
        const rowLocations = this.getLocationsInRow(location.row);
        const colLocations = this.getLocationsInCol(location.col);
        for (const locations of [blockLocations, rowLocations, colLocations]) {
          // Actually, there's a generalization of this rule that applies to any partition of the set of available values
          // such that if
          // a) the partition appears in exactly N locations where N equals the size of the partition
          // b) no value in the partition appears in any other location
          // then values outside of the partition can be excluded.
          // This is essentially the pigeonhole principle.
          // TODO: Implement!
          const otherAvailableValues = locations
            .filter((l) => !l.equals(location))
            .map((l) => this.getAvailableValues(l))
            .filter((v) => v.length > 0);
          for (const value of availableValues) {
            if (otherAvailableValues.every((v) => !v.includes(value))) {
              console.info(
                `Found unique value ${value} in ${location}`,
                locations,
                otherAvailableValues
              );
              this.availableValues[this.toIndex(location)] = [value];
              allSettled = false;
              return;
            }
          }
        }
      });
    }
  }

  private clamping() {
    // for each block
    for (const startCol of [1, 4, 7]) {
      for (const startRow of [1, 4, 7]) {
        // find the set of available values within each row/col
        const byColumn: Set<number>[] = [];
        const byRow: Set<number>[] = [];
        for (const x of [0, 1, 2]) {
          byColumn.push(new Set());
          byRow.push(new Set());
          for (const y of [0, 1, 2]) {
            this.getAvailableValues(
              new Location(startCol + x, startRow + y)
            ).forEach((value) => {
              byColumn[x].add(value);
            });
            this.getAvailableValues(
              new Location(startCol + y, startRow + x)
            ).forEach((value) => {
              byRow[x].add(value);
            });
          }
        }
        //console.info({ startCol, startRow, byColumn, byRow });
        // For each row/col
        for (const x of [0, 1, 2]) {
          // For each available value in the current row/col
          for (const value of byColumn[x]) {
            // If the value is not in the available set for the other rows/cols
            const others = [byColumn[(x + 1) % 3], byColumn[(x + 2) % 3]];
            if (others.every((set) => !set.has(value))) {
              const locationsToClear = this.getLocationsInCol(
                startCol + x
              ).filter((l) => l.row < startRow || l.row > startRow + 2);
              console.info({
                others,
                startCol,
                startRow,
                x,
                value,
                locationsToClear,
              });
              for (const location of locationsToClear) {
                this.availableValues[this.toIndex(location)] =
                  this.availableValues[this.toIndex(location)].filter(
                    (v) => v !== value
                  );
              }
            }
          }

          for (const value of byRow[x]) {
            // If the value is not in the available set for the other rows/cols
            const others = [byRow[(x + 1) % 3], byRow[(x + 2) % 3]];
            if (others.every((set) => !set.has(value))) {
              const locationsToClear = this.getLocationsInRow(
                startRow + x
              ).filter((l) => l.col < startCol || l.col > startCol + 2);
              console.info({
                others,
                startCol,
                startRow,
                x,
                value,
                locationsToClear,
              });
              for (const location of locationsToClear) {
                this.availableValues[this.toIndex(location)] =
                  this.availableValues[this.toIndex(location)].filter(
                    (v) => v !== value
                  );
              }
            }
          }
        }
      }
    }
  }

  public visitAll(callback: (location: Location) => void) {
    for (let row = 1; row <= 9; row++) {
      for (let col = 1; col <= 9; col++) {
        callback(new Location(col, row));
      }
    }
  }

  public getAvailableValues(location: Location): readonly number[] {
    return this.availableValues[this.toIndex(location)];
  }

  public satisfiesAllConstraints(location: Location, value: number) {
    return checkers.every((checker) => checker(this, location, value) === 0);
  }

  public countConflicts(location: Location, value: number | null = null) {
    let numConflicts = 0;
    if (!value) {
      value = this.get(location);
    }
    if (value) {
      for (const checker of checkers) {
        numConflicts += checker(this, location, value);
      }
    }
    return numConflicts;
  }

  public getOtherValuesInBlock(location: Location) {
    const locations = this.getLocationsInBlock(location).filter(
      (l) => !l.equals(location)
    );
    return this.getValues(locations);
  }

  private getLocationsInBlock(location: Location) {
    const result: Location[] = [];
    const block = location.block;
    const startCol = (block.col - 1) * 3 + 1;
    const startRow = (block.row - 1) * 3 + 1;
    for (let row = startRow; row < startRow + 3; row++) {
      for (let col = startCol; col < startCol + 3; col++) {
        result.push(new Location(col, row));
      }
    }
    return result;
  }

  public getOtherValuesInRow(location: Location) {
    const locations = this.getLocationsInRow(location.row).filter(
      (l) => !l.equals(location)
    );
    return this.getValues(locations);
  }

  public getOtherValuesInCol(location: Location) {
    const locations = this.getLocationsInCol(location.col).filter(
      (l) => !l.equals(location)
    );
    return this.getValues(locations);
  }

  private getLocationsInRow(row: number) {
    const result: Location[] = new Array(9);
    for (let col = 1; col <= 9; col++) {
      result[col - 1] = new Location(col, row);
    }
    return result;
  }

  private getLocationsInCol(col: number) {
    const result: Location[] = new Array(9);
    for (let row = 1; row <= 9; row++) {
      result[row - 1] = new Location(col, row);
    }
    return result;
  }

  private getValues(locations: Location[]) {
    return locations.map((l) => this.get(l)).filter((value) => value !== null);
  }

  private toIndex(location: Location) {
    return location.col - 1 + (location.row - 1) * 9;
  }
}

function numSameValueInBlock(game: Game, location: Location, value: number) {
  const otherValuesInBlock = game.getOtherValuesInBlock(location);
  return countOccurrences(otherValuesInBlock, value);
}

function numSameValueInRow(game: Game, location: Location, value: number) {
  const otherValuesInRow = game.getOtherValuesInRow(location);
  return countOccurrences(otherValuesInRow, value);
}

function numSameValueInCol(game: Game, location: Location, value: number) {
  const otherValuesInCol = game.getOtherValuesInCol(location);
  return countOccurrences(otherValuesInCol, value);
}

function countOccurrences(values: readonly number[], value: number) {
  let result = 0;
  for (const otherValue of values) {
    if (otherValue === value) {
      result++;
    }
  }
  return result;
}
