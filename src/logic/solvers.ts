import { Game, Location } from "./state";

export function localSearch(game: Game) {
  const allLocations: Location[] = [];
  game.visitAll((location) => {
    allLocations.push(location);
  });

  // Pick unique values
  let uniqueValuesAvailable = true;
  while (uniqueValuesAvailable) {
    uniqueValuesAvailable = false;
    game.visitAll((location) => {
      if (
        !game.get(location) &&
        game.getAvailableValues(location).length === 1
      ) {
        game.set(location, game.getAvailableValues(location)[0]);
        uniqueValuesAvailable = true;
      }
    });
  }

  const openLocations = allLocations.filter((location) => !game.get(location));

  // Prime with random values
  for (const location of openLocations) {
    game.set(location, getRandomInt(9) + 1);
  }

  const maxIterations = 2000;
  let iteration = 0;
  while (iteration < maxIterations) {
    iteration++;

    // Count conflicts in all locations that are not locked
    const conflictCounts = allLocations
      .map((location) => {
        return { location, numConflicts: game.countConflicts(location) };
      })
      .filter((x) => x.numConflicts > 0);

    if (conflictCounts.length === 0) {
      console.info("Solved in", iteration, "iterations");
      break;
    }

    const totalConflicts = conflictCounts.reduce(
      (acc, x) => acc + x.numConflicts,
      0
    );
    console.info(`Iteration ${iteration}: ${totalConflicts} conflicts`);

    // Pick a conflicting location at random
    const { location } = conflictCounts[getRandomInt(conflictCounts.length)];

    const valueConflicts = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => {
      return { value, numConflicts: game.countConflicts(location, value) };
    });
    valueConflicts.sort((a, b) => a.numConflicts - b.numConflicts);
    console.info("ValueConflicts", valueConflicts);

    // assign a value to it that minimizes the number of conflicts
    const minConflicts = valueConflicts[0].numConflicts;
    const candidates = valueConflicts.filter(
      (x) => x.numConflicts === minConflicts
    );
    const newValue = candidates[getRandomInt(candidates.length)].value;
    game.set(location, newValue);
  }
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
