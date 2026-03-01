// ─── Tile Type Enum ───────────────────────────────────────────────────────────

export enum TileType {
  Blank        = 'blank',
  Positive     = 'num',
  Negative     = 'neg',
  Multiplier   = 'mul',
  LockedPos    = 'lnum',
  LockedNeg    = 'lneg',
  LockedBlank  = 'lblank',
  EntryGate    = 'entry',
  LockedEntry  = 'entry_lk',
  ExitGate     = 'exit',
  LockedExit   = 'exit_lk',
  Checkpoint   = 'ckpt',
}

// ─── Direction Enum ───────────────────────────────────────────────────────────

export enum Direction {
  Up    = 'U',
  Down  = 'D',
  Left  = 'L',
  Right = 'R',
}

// ─── Game Status Enum ─────────────────────────────────────────────────────────

export enum GameStatus {
  Idle    = 'idle',    // Player hasn't picked a starting cell yet
  Playing = 'playing', // Game in progress
  Won     = 'won',     // All cells visited, finished at exactly 0 energy
}

export enum Level {
  Easy    = 'easy',      // 3x3
  Medium  = 'medium',    // 4x4
  Hard    = 'hard',      // 4x4
  Brutal  = 'brutal',    // 5x5
}

// ─── Tile ─────────────────────────────────────────────────────────────────────

export interface Tile {
  type: TileType;
  value?: number;                       // Energy amount for Positive / Negative / Multiplier
  minimumEnergyRequired?: number;       // Checkpoint only: must arrive with >= this energy
  allowedEntryDirections?: Direction[]; // EntryGate: allowed walk-in directions
  allowedExitDirections?: Direction[];  // ExitGate: allowed walk-out directions
}

// ─── Position ─────────────────────────────────────────────────────────────────

export type Position = [row: number, col: number];

// ─── Puzzle ───────────────────────────────────────────────────────────────────

export interface Puzzle {
  id: string;
  difficulty: Level.Easy | Level.Medium | Level.Hard | Level.Brutal;
  gridSize: number;
  movesNeededToUnlockTiles: number;
  grid: Tile[][];
  correctSolution: Position[];
  hintStartCell: Position;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  puzzle: Puzzle;
  visitedCells: boolean[][];
  pathSoFar: Position[];
  playerPosition: Position | null;
  currentEnergy: number;
  totalMovesMade: number;
  lockedTilesAreUnlocked: boolean;
  forcedNextDirections: Direction[] | null; // Set when standing on an ExitGate
  status: GameStatus;
}