import { Board } from "./components/Board";
import "./App.css";
import { GameProvider } from "./components/GameContext";
import { PossibleValues } from "./components/PossibleValues";

function App() {
  return (
    <>
      <h1>Sudoku Helper</h1>
      <GameProvider>
        <Board />
        <PossibleValues />
      </GameProvider>
    </>
  );
}

export default App;
