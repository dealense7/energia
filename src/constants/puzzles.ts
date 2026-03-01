import { Puzzle, TileType, Direction, Level } from '../engine/types';

export const PUZZLES: Record<string, Puzzle> = {
  easy: {
    id: 'easy_3x3_001',
    difficulty: Level.Easy,
    gridSize: 3,
    movesNeededToUnlockTiles: 0,
    grid: [
      [
        { type: TileType.Positive, value: 3 },
        { type: TileType.Blank },
        { type: TileType.Negative, value: -2 },
      ],
      [
        { type: TileType.Blank },
        { type: TileType.Multiplier, value: 2 },
        { type: TileType.Blank },
      ],
      [
        { type: TileType.Negative, value: -1 },
        { type: TileType.Blank },
        { type: TileType.Positive, value: 1 },
      ],
    ],
    correctSolution: [[0,0],[0,1],[0,2],[1,2],[2,2],[2,1],[2,0],[1,0],[1,1]],
    hintStartCell: [0, 0],
  },

  medium: {
    id: 'medium_4x4_001',
    difficulty: Level.Medium,
    gridSize: 4,
    movesNeededToUnlockTiles: 5,
    grid: [
      [
        { type: TileType.Negative,  value: -1 },
        { type: TileType.LockedPos, value: 1 },
        { type: TileType.Positive,  value: 4 },
        { type: TileType.Blank },
      ],
      [
        { type: TileType.Negative,   value: -4 },
        { type: TileType.Blank },
        { type: TileType.Positive,   value: 7 },
        { type: TileType.Multiplier, value: 3 },
      ],
      [
        { type: TileType.Negative,  value: -2 },
        { type: TileType.LockedNeg, value: -3 },
        { type: TileType.Positive,  value: 6 },
        { type: TileType.ExitGate,  value: 0, allowedExitDirections: [Direction.Up] },
      ],
      [
        { type: TileType.EntryGate, value: 0, allowedEntryDirections: [Direction.Down, Direction.Left] },
        { type: TileType.Positive, value: 3 },
        { type: TileType.Blank },
        { type: TileType.Blank },
      ],
    ],
    correctSolution: [[2,2],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[1,2],[0,2]],
    hintStartCell: [1, 2],
  },

  hard: {
    id: 'hard_4x4_001',
    difficulty: Level.Hard,
    gridSize: 4,
    movesNeededToUnlockTiles: 5,
    grid: [
      [
        { type: TileType.Positive,  value: 5 },
        { type: TileType.Blank },
        { type: TileType.Negative,  value: -2 },
        { type: TileType.LockedPos, value: 3 },
      ],
      [
        { type: TileType.Multiplier, value: 2 },
        { type: TileType.Checkpoint, minimumEnergyRequired: 4 },
        { type: TileType.Blank },
        { type: TileType.Negative,   value: -1 },
      ],
      [
        { type: TileType.Blank },
        { type: TileType.Negative,  value: -3 },
        { type: TileType.Positive,  value: 4 },
        { type: TileType.LockedNeg, value: -2 },
      ],
      [
        { type: TileType.EntryGate, value: 0, allowedEntryDirections: [Direction.Up] },
        { type: TileType.Blank },
        { type: TileType.ExitGate,  value: 0, allowedExitDirections: [Direction.Up, Direction.Right] },
        { type: TileType.Negative,  value: -2 },
      ],
    ],
    correctSolution: [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[1,2],[0,2],[0,1],[1,1],[2,1],[2,3],[1,3],[0,3],[3,3]],
    hintStartCell: [0, 0],
  },

  brutal: {
    id: 'brutal_4x4_001',
    difficulty: Level.Brutal,
    gridSize: 5,
    movesNeededToUnlockTiles: 5,
    grid: [
      [
        { type: TileType.Positive,  value: 5 },
        { type: TileType.Blank },
        { type: TileType.Negative,  value: -2 },
        { type: TileType.LockedPos, value: 3 },
        { type: TileType.LockedPos, value: 3 },
      ],
      [
        { type: TileType.Multiplier, value: 2 },
        { type: TileType.Checkpoint, minimumEnergyRequired: 4 },
        { type: TileType.Blank },
        { type: TileType.Negative,   value: -1 },
        { type: TileType.Negative,   value: -1 },
      ],
      [
        { type: TileType.Blank },
        { type: TileType.Negative,  value: -3 },
        { type: TileType.Positive,  value: 4 },
        { type: TileType.LockedNeg, value: -2 },
        { type: TileType.LockedNeg, value: -2 },
      ],
      [
        { type: TileType.EntryGate, value: 0, allowedEntryDirections: [Direction.Up] },
        { type: TileType.Blank },
        { type: TileType.ExitGate,  value: 0, allowedExitDirections: [Direction.Up, Direction.Right] },
        { type: TileType.Negative,  value: -2 },
        { type: TileType.Negative,  value: -2 },
      ],
      [
        { type: TileType.Blank },
        { type: TileType.Negative,  value: -3 },
        { type: TileType.Positive,  value: 4 },
        { type: TileType.LockedNeg, value: -2 },
        { type: TileType.LockedNeg, value: -2 },
      ],
    ],
    correctSolution: [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[2,2],[1,2],[0,2],[0,1],[1,1],[2,1],[2,3],[1,3],[0,3],[3,3]],
    hintStartCell: [0, 0],
  },
};