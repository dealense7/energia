import { Puzzle, Position, Tile, TileType, Level } from './types';

export function generateTutorialPuzzle(): { puzzle: Puzzle; seed: number } {
  const seed = 0;

  const grid: Tile[][] = [
    [
      { type: TileType.Positive, value: 2 },    // [0,0] 7
      { type: TileType.Blank },    // [0,1] 8
      { type: TileType.Positive, value: 4 },    // [0,2] 1
    ],
    [
      { type: TileType.Blank },                   // [1,0] 6
      { type: TileType.Blank },     // [1,1] 9
      { type: TileType.Blank },                   // [1,2] 2
    ],
    [
      { type: TileType.Negative, value: -2 },      // [2,0] 5
      { type: TileType.Blank },                   // [2,1] 4
      { type: TileType.Multiplier, value: 3 },    // [2,2] 3
    ],
  ];

  // Simple solution avoiding complexity - just a valid path
  const simpleSolution: Position[] = [
    [0, 2], [1, 2], [2, 2],
    [2, 1], [2, 0], [1, 0],
    [0, 0], [0, 1], [1, 1]
  ];

  const puzzle: Puzzle = {
    id: 'tutorial',
    difficulty: Level.Easy,
    gridSize: 3,
    movesNeededToUnlockTiles: 0, // No locked tiles in tutorial
    grid,
    correctSolution: simpleSolution,
    hintStartCell: [0, 0],
    seed,
  };

  return { puzzle, seed };
}
