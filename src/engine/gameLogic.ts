import { GameState, GameStatus, Puzzle, Position } from './types';
import {
  tileIsLocked, tileIsEntryGate, tileIsExitGate,
  tileIsCheckpoint, tileIsValidStart,
  directionBetween, applyTileEnergyEffect,
} from './tileHelpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyVisitedGrid(size: number): boolean[][] {
  return Array.from({ length: size }, () => new Array(size).fill(false));
}

function adjacentCells(pos: Position, gridSize: number): Position[] {
  const [r, c] = pos;
  return ([
    [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
  ] as Position[]).filter(([nr, nc]) => nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize);
}

function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function allCellsVisited(grid: boolean[][]): boolean {
  return grid.every(row => row.every(Boolean));
}

// ─── Initial state ────────────────────────────────────────────────────────────

export function createInitialGameState(puzzle: Puzzle): GameState {
  return {
    puzzle,
    visitedCells:           emptyVisitedGrid(puzzle.gridSize),
    pathSoFar:              [],
    playerPosition:         null,
    currentEnergy:          0,
    totalMovesMade:         0,
    lockedTilesAreUnlocked: false,
    forcedNextDirections:   null,
    status:                 GameStatus.Idle,
  };
}

// ─── Move validation ──────────────────────────────────────────────────────────

export function cellIsTappable(state: GameState, target: Position): boolean {
  const { puzzle, playerPosition, visitedCells, totalMovesMade, forcedNextDirections } = state;
  const tile = puzzle.grid[target[0]][target[1]];

  // First tap — picking a starting cell
  if (!playerPosition) {
    return tileIsValidStart(tile);
  }

  if (!isAdjacent(playerPosition, target))            return false;
  if (visitedCells[target[0]][target[1]])              return false;

  const direction = directionBetween(playerPosition, target);
  if (!direction)                                      return false;

  // Exit gate on the current tile forces the next direction
  if (forcedNextDirections && !forcedNextDirections.includes(direction)) return false;

  // Locked tiles need enough moves first
  if (tileIsLocked(tile) && totalMovesMade < puzzle.movesNeededToUnlockTiles) return false;

  // Entry gate restricts which side you can walk in from
  if (tileIsEntryGate(tile) && !(tile.allowedEntryDirections ?? []).includes(direction)) return false;

  // Moving always costs 1 energy
  const energyOnArrival = state.currentEnergy - 1;
  if (energyOnArrival < 0) return false;

  // Checkpoint requires a minimum energy on arrival
  if (tileIsCheckpoint(tile) && energyOnArrival < (tile.minimumEnergyRequired ?? 0)) return false;

  // Tile effect must not drive energy below zero
  if (applyTileEnergyEffect(energyOnArrival, tile) < 0) return false;

  return true;
}

// ─── Apply a move ─────────────────────────────────────────────────────────────

export function movePlayerToCell(state: GameState, target: Position): GameState | null {
  if (!cellIsTappable(state, target)) return null;

  const [targetRow, targetCol] = target;
  const tile = state.puzzle.grid[targetRow][targetCol];

  const updatedVisited  = state.visitedCells.map(row => [...row]);
  updatedVisited[targetRow][targetCol] = true;

  // First tap: start energy comes from the tile's face value
  if (!state.playerPosition) {
    return {
      ...state,
      playerPosition:         target,
      currentEnergy:          tile.value ?? 0,
      totalMovesMade:         1,
      visitedCells:           updatedVisited,
      pathSoFar:              [target],
      forcedNextDirections:   tileIsExitGate(tile) ? (tile.allowedExitDirections ?? null) : null,
      status:                 GameStatus.Playing,
    };
  }

  const energyOnArrival  = state.currentEnergy - 1;
  const energyAfterTile  = applyTileEnergyEffect(energyOnArrival, tile);
  const updatedMoveCount = state.totalMovesMade + 1;
  const updatedPath      = [...state.pathSoFar, target];

  const playerWon = allCellsVisited(updatedVisited);

  return {
    ...state,
    playerPosition:         target,
    currentEnergy:          energyAfterTile,
    totalMovesMade:         updatedMoveCount,
    lockedTilesAreUnlocked: updatedMoveCount >= state.puzzle.movesNeededToUnlockTiles,
    visitedCells:           updatedVisited,
    pathSoFar:              updatedPath,
    forcedNextDirections:   tileIsExitGate(tile) ? (tile.allowedExitDirections ?? null) : null,
    status:                 playerWon ? GameStatus.Won : GameStatus.Playing,
  };
}

// ─── Stuck detection ──────────────────────────────────────────────────────────

export function playerIsStuck(state: GameState): boolean {
  if (!state.playerPosition || state.status !== GameStatus.Playing) return false;
  return adjacentCells(state.playerPosition, state.puzzle.gridSize)
    .every(neighbour => !cellIsTappable(state, neighbour));
}