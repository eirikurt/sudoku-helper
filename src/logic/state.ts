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
}

type constraintChecker = (
  game: Game,
  location: Location,
  value: number
) => boolean;

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
    console.trace("updateAvailableValues");
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

  private visitAll(callback: (location: Location) => void) {
    for (let row = 1; row <= 9; row++) {
      for (let col = 1; col <= 9; col++) {
        callback(new Location(col, row));
      }
    }
  }

  public getAvailableValues(location: Location): readonly number[] {
    return this.availableValues[this.toIndex(location)];
  }

  private satisfiesAllConstraints(location: Location, value: number) {
    const checkers: constraintChecker[] = [
      isUniqueInBlock,
      isUniqueInRow,
      isUniqueInCol,
    ];
    return checkers.every((checker) => checker(this, location, value));
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

function isUniqueInBlock(game: Game, location: Location, value: number) {
  const otherValuesInBlock = game.getOtherValuesInBlock(location);
  return !otherValuesInBlock.includes(value);
}

function isUniqueInRow(game: Game, location: Location, value: number) {
  const otherValuesInRow = game.getOtherValuesInRow(location);
  return !otherValuesInRow.includes(value);
}

function isUniqueInCol(game: Game, location: Location, value: number) {
  const otherValuesInCol = game.getOtherValuesInCol(location);
  return !otherValuesInCol.includes(value);
}
