import { Tile, TileType, Direction, Position, Puzzle, Level } from './types';

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface GeneratorConfig {
  gridSize:     number;
  lockThreshold: number; // locked tiles can't be entered until this many moves have been made

  // How many tiles of each type to place
  lockedCount:           number; // split evenly between LockedPos and LockedNeg
  lockedBlankCount:      number;
  positiveCount:         number;
  negativeCount:         number;
  multiplierCount:       number;
  entryGateCount:        number;
  lockedEntryGateCount:  number;
  exitGateCount:         number;
  lockedExitGateCount:   number;
  checkpointCount:       number;

  // Value ranges for each tile type
  positiveRange:      [number, number];
  negativeRange:      [number, number]; // negative numbers e.g. [-4, -1]
  multiplierValues:   number[];
  lockedPositiveRange: [number, number];
  lockedNegativeRange: [number, number];
  checkpointRange:    [number, number]; // threshold chosen randomly in this range

  // Difficulty tuning
  banStartOnMaxTile:       boolean; // don't let the correct start tile be the highest-energy one
  lockBiggestPositiveProb: number;  // probability of locking the highest +N tile
  minStartCandidates:      number;  // how many plausible starting tiles must exist
  maxStartingEnergy?:      number;  // cap on the starting tile's energy value
  tightEnergy:             boolean; // reject puzzles where energy never drops near zero
  tightThreshold:          number;  // "near zero" means <= this value
  minEnergyFloor:          number;  // prune solver branches that drop below this mid-path

  // Solution uniqueness
  targetSolutions:    number; // almost always 1
  requireLocksMatter: boolean; // reject puzzles where removing locks doesn't change the solution count

  // Search budget
  maxAttempts: number;
  seed?:       number;
}

export interface GeneratedPuzzle {
  grid:     Tile[][];
  solution: Position[];
  trace:    number[]; // energy value at each step along the solution
  attempts: number;
  seed:     number;   // ← the resolved seed used to generate this puzzle
  stats: {
    minEnergy:  number;
    maxEnergy:  number;
    tightSteps: number; // how many steps had energy <= tightThreshold
    startPos:   Position;
  };
}

// ─── Difficulty presets ───────────────────────────────────────────────────────

export const GENERATOR_PRESETS: Record<string, GeneratorConfig> = {

  easy_3x3: {
    gridSize: 3, lockThreshold: 3,
    // No locks — clean intro puzzle
    lockedCount: 0, lockedBlankCount: 0,
    positiveCount: 1, negativeCount: 1, multiplierCount: 1,
    positiveRange: [3, 6], negativeRange: [-2, -1], multiplierValues: [2, 3],
    lockedPositiveRange: [1, 4], lockedNegativeRange: [-3, -1],
    entryGateCount: 0, lockedEntryGateCount: 0,
    exitGateCount:  0, lockedExitGateCount:  0,
    checkpointCount: 0, checkpointRange: [2, 5],
    banStartOnMaxTile: false, lockBiggestPositiveProb: 0.0, minStartCandidates: 1,
    tightEnergy: false, tightThreshold: 3, minEnergyFloor: 1,
    targetSolutions: 1, requireLocksMatter: false,
    maxAttempts: 20_000,
  },

  medium_4x4: {
    gridSize: 4, lockThreshold: 5,
    // Introduces locks and directional gates
    lockedCount: 2, lockedBlankCount: 0,
    positiveCount: 3, negativeCount: 3, multiplierCount: 1,
    positiveRange: [2, 7], negativeRange: [-4, -1], multiplierValues: [2, 2, 3],
    lockedPositiveRange: [1, 4], lockedNegativeRange: [-3, -1],
    entryGateCount: 1, lockedEntryGateCount: 0,
    exitGateCount:  1, lockedExitGateCount:  0,
    checkpointCount: 0, checkpointRange: [3, 6],
    banStartOnMaxTile: true, lockBiggestPositiveProb: 0.4, minStartCandidates: 3,
    tightEnergy: true, tightThreshold: 3, minEnergyFloor: 1,
    targetSolutions: 1, requireLocksMatter: true,
    maxAttempts: 50_000,
  },

  hard_4x4: {
    gridSize: 4, lockThreshold: 5,
    // Adds checkpoints and locked gates; tighter energy budget
    lockedCount: 2, lockedBlankCount: 0,
    positiveCount: 3, negativeCount: 3, multiplierCount: 1,
    positiveRange: [2, 7], negativeRange: [-5, -1], multiplierValues: [2, 3],
    lockedPositiveRange: [1, 4], lockedNegativeRange: [-3, -1],
    entryGateCount: 1, lockedEntryGateCount: 1,
    exitGateCount:  1, lockedExitGateCount:  0,
    checkpointCount: 1, checkpointRange: [3, 6],
    banStartOnMaxTile: true, lockBiggestPositiveProb: 0.5, minStartCandidates: 3,
    maxStartingEnergy: 8,
    tightEnergy: true, tightThreshold: 2, minEnergyFloor: 1,
    targetSolutions: 1, requireLocksMatter: true,
    maxAttempts: 50_000,
  },

  brutal_5x5: {
    gridSize: 5, lockThreshold: 7,
    // Everything at once on a larger grid
    lockedCount: 3, lockedBlankCount: 0,
    positiveCount: 4, negativeCount: 5, multiplierCount: 2,
    positiveRange: [2, 8], negativeRange: [-5, -1], multiplierValues: [2, 2, 3],
    lockedPositiveRange: [1, 5], lockedNegativeRange: [-4, -1],
    entryGateCount: 2, lockedEntryGateCount: 1,
    exitGateCount:  1, lockedExitGateCount:  0,
    checkpointCount: 1, checkpointRange: [3, 6],
    banStartOnMaxTile: true, lockBiggestPositiveProb: 0.5, minStartCandidates: 4,
    maxStartingEnergy: 10,
    tightEnergy: true, tightThreshold: 3, minEnergyFloor: 1,
    targetSolutions: 1, requireLocksMatter: true,
    maxAttempts: 50_000,
  },

};

// ─── Seeded RNG (Mulberry32) ──────────────────────────────────────────────────
// We can't seed Math.random(), so we use a simple but solid hash-based PRNG.

function createRng(seed?: number) {
  // Resolve seed once so we can expose it on the returned object
  const resolvedSeed: number = seed !== undefined ? seed : (Math.random() * 0xffffffff) >>> 0;
  let state = resolvedSeed;

  function nextFloat(): number {
    state |= 0;
    state  = state + 0x6d2b79f5 | 0;
    let t  = Math.imul(state ^ state >>> 15, 1 | state);
    t      = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 0xffffffff;
  }

  return {
    seed:    resolvedSeed,                                       // ← exposed seed
    float:   ()                    => nextFloat(),
    int:     (lo: number, hi: number) => Math.floor(nextFloat() * (hi - lo + 1)) + lo,
    pick:    <T>(arr: T[])         => arr[Math.floor(nextFloat() * arr.length)],
    shuffle: <T>(arr: T[])         => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(nextFloat() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}

type Rng = ReturnType<typeof createRng>;

// ─── Direction helpers ────────────────────────────────────────────────────────

const ALL_DIRS = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];

const DIR_DELTA: Record<Direction, [number, number]> = {
  [Direction.Up]:    [-1,  0],
  [Direction.Down]:  [ 1,  0],
  [Direction.Left]:  [ 0, -1],
  [Direction.Right]: [ 0,  1],
};

function directionBetween(from: Pos, to: Pos): Direction {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  for (const dir of ALL_DIRS) {
    const [ddr, ddc] = DIR_DELTA[dir];
    if (ddr === dr && ddc === dc) return dir;
  }
  throw new Error(`Cells are not adjacent: [${from}] → [${to}]`);
}

function neighboursOf(pos: Pos, gridSize: number): Pos[] {
  const [r, c] = pos;
  return ALL_DIRS
    .map(dir => [r + DIR_DELTA[dir][0], c + DIR_DELTA[dir][1]] as Pos)
    .filter(([nr, nc]) => nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize);
}

// Compact string key for use in Sets/Maps — avoids object reference issues
function key(pos: Pos): string { return `${pos[0]},${pos[1]}`; }

type Pos = [number, number];

// ─── Tile helpers ─────────────────────────────────────────────────────────────

const LOCKED_TILE_TYPES = new Set([
  TileType.LockedPos, TileType.LockedNeg, TileType.LockedBlank,
  TileType.LockedEntry, TileType.LockedExit,
]);

function tileIsLocked(tile: Tile): boolean {
  return LOCKED_TILE_TYPES.has(tile.type);
}

function tileIsValidStart(tile: Tile): boolean {
  // A valid start tile must be unlocked, have a face value, and that value must be positive
  // (negative or zero starting energy means the player is immediately stuck)
  return !tileIsLocked(tile)
    && tile.type !== TileType.Blank
    && tile.type !== TileType.Checkpoint
    && tileStartEnergy(tile) > 0;
}

function tileStartEnergy(tile: Tile): number {
  // The starting tile's energy is its face value.
  // Only tiles with a positive value are valid starting points.
  switch (tile.type) {
    case TileType.Positive:
    case TileType.Negative:
    case TileType.Multiplier:
    case TileType.EntryGate:
    case TileType.ExitGate:
      return (tile.value ?? 0) > 0 ? tile.value! : 0;
    default:
      return 0;
  }
}

function applyTileEnergy(energyOnArrival: number, tile: Tile): number {
  // Called AFTER paying the 1-energy movement cost (energyOnArrival is already decremented).
  switch (tile.type) {
    case TileType.Multiplier:
      return energyOnArrival * (tile.value ?? 1);
    case TileType.Positive:
    case TileType.Negative:
    case TileType.LockedPos:
    case TileType.LockedNeg:
    case TileType.EntryGate:
    case TileType.LockedEntry:
    case TileType.ExitGate:
    case TileType.LockedExit:
      return energyOnArrival + (tile.value ?? 0);
    default:
      // Blank and Checkpoint tiles don't change energy
      return energyOnArrival;
  }
}

// ─── Step 1: Hamiltonian path via Warnsdorff's heuristic ─────────────────────
//
// We need a path that visits every cell exactly once (a Hamiltonian path).
// Warnsdorff's heuristic: always move to the neighbour that has the FEWEST
// unvisited neighbours — this avoids dead ends and finds paths quickly.
// We retry from random starts until one succeeds.

function generateHamiltonianPath(gridSize: number, rng: Rng, maxTries = 30): Pos[] | null {
  const totalCells = gridSize * gridSize;
  const allCells: Pos[] = [];
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      allCells.push([r, c]);

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const startCell = rng.pick(allCells);
    const visited   = new Set<string>([key(startCell)]);
    const path      = [startCell];
    let   current   = startCell;
    let   succeeded = true;

    while (path.length < totalCells) {
      const unvisitedNeighbours = neighboursOf(current, gridSize)
        .filter(n => !visited.has(key(n)));

      if (!unvisitedNeighbours.length) { succeeded = false; break; }

      // Shuffle first so ties are broken randomly (not always same direction)
      rng.shuffle(unvisitedNeighbours);

      // Warnsdorff: pick the neighbour with fewest onward moves
      unvisitedNeighbours.sort((a, b) => {
        const aOnward = neighboursOf(a, gridSize).filter(n => !visited.has(key(n))).length;
        const bOnward = neighboursOf(b, gridSize).filter(n => !visited.has(key(n))).length;
        return aOnward - bOnward;
      });

      current = unvisitedNeighbours[0];
      visited.add(key(current));
      path.push(current);
    }

    if (succeeded) return path;
  }

  return null;
}

// ─── Step 2: Assign allowed directions to gate tiles ─────────────────────────
//
// Gate tiles restrict which direction you can enter/exit.
// We always include the actual solution direction, then optionally add one
// extra valid direction to make the constraint less obvious.

function buildEntryDirs(path: Pos[], tileIndex: number, gridSize: number, rng: Rng): Direction[] {
  // First tile has no "incoming" direction — no restriction needed
  if (tileIndex === 0) return [...ALL_DIRS];

  const actualEntryDir = directionBetween(path[tileIndex - 1], path[tileIndex]);

  // All physically possible directions to enter this cell from
  const possibleEntryDirs = neighboursOf(path[tileIndex], gridSize)
    .map(neighbour => directionBetween(neighbour, path[tileIndex]));

  // Optionally include one extra direction as a red herring
  const otherDirs  = rng.shuffle(possibleEntryDirs.filter(d => d !== actualEntryDir));
  const redHerring = otherDirs.slice(0, rng.int(0, Math.min(1, otherDirs.length)));

  return [actualEntryDir, ...redHerring];
}

function buildExitDirs(path: Pos[], tileIndex: number, gridSize: number, rng: Rng): Direction[] {
  // Last tile has no "outgoing" direction — no restriction needed
  if (tileIndex >= path.length - 1) return [...ALL_DIRS];

  const actualExitDir = directionBetween(path[tileIndex], path[tileIndex + 1]);

  // All physically possible directions to leave this cell
  const possibleExitDirs = neighboursOf(path[tileIndex], gridSize)
    .map(neighbour => directionBetween(path[tileIndex], neighbour));

  // Optionally include one extra direction as a red herring
  const otherDirs  = rng.shuffle(possibleExitDirs.filter(d => d !== actualExitDir));
  const redHerring = otherDirs.slice(0, rng.int(0, Math.min(1, otherDirs.length)));

  return [actualExitDir, ...redHerring];
}

// ─── Step 3: Build the grid ───────────────────────────────────────────────────
//
// Given a Hamiltonian path, assign a tile type and value to every cell such
// that walking the path in order is a valid, solvable game.
//
// The key insight is the "slack tile": one positive tile whose value we compute
// analytically (rather than randomly) so the path ends at exactly 0 energy.
// Everything else is random within the configured ranges.

function buildGrid(path: Pos[], cfg: GeneratorConfig, rng: Rng): Tile[][] | null {
  const N          = cfg.gridSize;
  const pathLength = path.length;

  // ── 3a. Decide which path indices get which tile type ──────────────────────

  const tileTypeAt = assignTileTypesToPathIndices(path, cfg, rng);
  if (!tileTypeAt) return null;

  const { slackIndex, checkpointIndices } = tileTypeAt;

  // ── 3b. Assign random values to every tile except the slack tile ───────────

  const tiles = buildTilesWithRandomValues(path, tileTypeAt.indexToType, slackIndex, N, cfg, rng);
  if (!tiles) return null;

  // ── 3c. Solve for the slack tile's value so the path ends at exactly 0 ─────

  const slackValue = computeSlackTileValue(tiles, slackIndex, cfg.positiveRange);
  if (slackValue === null) return null;

  tiles[slackIndex] = { type: TileType.Positive, value: slackValue };

  // ── 3d. Now that we know the full energy trace, fix checkpoint thresholds ──

  const energyAtEachStep = computeEnergyTrace(tiles);
  const checkpointsOk    = assignCheckpointThresholds(tiles, checkpointIndices, energyAtEachStep, cfg.checkpointRange, rng);
  if (!checkpointsOk) return null;

  // ── 3e. Optionally lock the highest +N tile for extra challenge ────────────

  maybePromoteLargestPositiveToLocked(tiles, cfg, rng);

  // ── 3f. Final sanity check: walk the path and confirm the rules hold ───────

  if (!validatePathIsWinnable(tiles, path)) return null;

  // ── 3g. Lay the flat tiles array into a 2D grid ────────────────────────────

  return arrangeTilesIntoGrid(tiles, path, N);
}

// ── 3a helper: assign tile types to each position in the path ─────────────────

interface TileAssignment {
  indexToType:      Map<number, TileType>;
  slackIndex:       number;
  checkpointIndices: Set<number>;
}

function assignTileTypesToPathIndices(
  path: Pos[],
  cfg: GeneratorConfig,
  rng: Rng,
): TileAssignment | null {
  const pathLength = path.length;
  const indexToType = new Map<number, TileType>();

  // Index 0 is always the start tile — always a positive energy tile
  indexToType.set(0, TileType.Positive);

  // ── Assign locked tiles ────────────────────────────────────────────────────
  // Locked tiles must appear AFTER lockThreshold moves so the player can reach them

  const lockedPosCount   = Math.floor(cfg.lockedCount / 2);
  const lockedNegCount   = cfg.lockedCount - lockedPosCount;
  const totalLockedTiles = lockedPosCount + lockedNegCount + cfg.lockedBlankCount
                         + cfg.lockedEntryGateCount + cfg.lockedExitGateCount;

  const indicesAfterLockThreshold = rng.shuffle(
    Array.from({ length: pathLength - cfg.lockThreshold }, (_, i) => i + cfg.lockThreshold)
  );
  if (indicesAfterLockThreshold.length < totalLockedTiles) return null;

  const timedLockIndices = indicesAfterLockThreshold.slice(0, lockedPosCount + lockedNegCount + cfg.lockedBlankCount);
  const lockedEntryIndices = new Set(indicesAfterLockThreshold.slice(
    timedLockIndices.length,
    timedLockIndices.length + cfg.lockedEntryGateCount,
  ));
  const lockedExitIndices = new Set(indicesAfterLockThreshold.slice(
    timedLockIndices.length + cfg.lockedEntryGateCount,
    timedLockIndices.length + cfg.lockedEntryGateCount + cfg.lockedExitGateCount,
  ));

  timedLockIndices.forEach((idx, i) => {
    if      (i < lockedPosCount)                          indexToType.set(idx, TileType.LockedPos);
    else if (i < lockedPosCount + lockedNegCount)         indexToType.set(idx, TileType.LockedNeg);
    else                                                  indexToType.set(idx, TileType.LockedBlank);
  });
  lockedEntryIndices.forEach(idx => indexToType.set(idx, TileType.LockedEntry));
  lockedExitIndices.forEach (idx => indexToType.set(idx, TileType.LockedExit));

  // ── Assign non-locked tiles from the remaining free indices ───────────────

  const reservedIndices = new Set([0, ...timedLockIndices, ...lockedEntryIndices, ...lockedExitIndices]);
  const freeIndices     = rng.shuffle(
    Array.from({ length: pathLength }, (_, i) => i).filter(i => !reservedIndices.has(i))
  );

  const totalNonLockedSpecialTiles = cfg.positiveCount + cfg.negativeCount + cfg.multiplierCount
                                   + cfg.entryGateCount + cfg.exitGateCount + cfg.checkpointCount;
  if (freeIndices.length < totalNonLockedSpecialTiles) return null;

  // The "slack" tile is the special positive tile whose value is computed analytically.
  // We place it in the LAST quarter of the path so most of the simulation is done
  // before we hit it — this makes the required slack value easier to land in range.
  const lastQuarterStart = Math.max(1, Math.floor((3 * pathLength) / 4));
  const lateIndices      = freeIndices.filter(i => i >= lastQuarterStart);
  const earlyIndices     = freeIndices.filter(i => i < lastQuarterStart);
  if (!lateIndices.length) return null;

  const slackIndex     = lateIndices[0];
  const extraPosCount  = Math.max(0, cfg.positiveCount - 1); // remaining positives after the slack
  if (earlyIndices.length < extraPosCount) return null;

  const positiveIndices = new Set([slackIndex, ...earlyIndices.slice(0, extraPosCount)]);

  // Prefer placing negative tiles in the SECOND half of the path so the player
  // builds up energy before draining it — makes puzzles more interesting
  const midpoint   = Math.floor(pathLength / 2);
  const nonPosPool = freeIndices.filter(i => !positiveIndices.has(i));
  const negatives  = [...nonPosPool.filter(i => i >= midpoint), ...nonPosPool.filter(i => i < midpoint)]
                       .slice(0, cfg.negativeCount);
  if (negatives.length < cfg.negativeCount) return null;

  const negativeIndices = new Set(negatives);

  // Remaining tile types fill in whatever slots are left
  let remainingPool = rng.shuffle(freeIndices.filter(i => !positiveIndices.has(i) && !negativeIndices.has(i)));
  const take = (n: number): number[] => { const chunk = remainingPool.splice(0, n); return chunk; };

  const multiplierIndices  = new Set(take(cfg.multiplierCount));
  const entryGateIndices   = new Set(take(cfg.entryGateCount));
  const exitGateIndices    = new Set(take(cfg.exitGateCount));
  const checkpointIndices  = new Set(take(cfg.checkpointCount));
  if (multiplierIndices.size < cfg.multiplierCount) return null;

  // Merge all assignments into the map
  negativeIndices.forEach  (idx => indexToType.set(idx, TileType.Negative));
  multiplierIndices.forEach(idx => indexToType.set(idx, TileType.Multiplier));
  positiveIndices.forEach  (idx => indexToType.set(idx, TileType.Positive));
  entryGateIndices.forEach (idx => indexToType.set(idx, TileType.EntryGate));
  exitGateIndices.forEach  (idx => indexToType.set(idx, TileType.ExitGate));
  checkpointIndices.forEach(idx => indexToType.set(idx, TileType.Checkpoint));

  return { indexToType, slackIndex, checkpointIndices };
}

// ── 3b helper: build tiles with random values (slack tile left as null) ────────

function buildTilesWithRandomValues(
  path: Pos[],
  indexToType: Map<number, TileType>,
  slackIndex: number,
  gridSize: number,
  cfg: GeneratorConfig,
  rng: Rng,
): Array<Tile | null> | null {
  const tiles: Array<Tile | null> = new Array(path.length).fill(null);

  for (let i = 0; i < path.length; i++) {
    if (i === slackIndex) continue; // filled in later

    switch (indexToType.get(i) ?? TileType.Blank) {
      case TileType.Positive:    tiles[i] = { type: TileType.Positive,    value: rng.int(...cfg.positiveRange) };      break;
      case TileType.Negative:    tiles[i] = { type: TileType.Negative,    value: rng.int(...cfg.negativeRange) };      break;
      case TileType.Multiplier:  tiles[i] = { type: TileType.Multiplier,  value: rng.pick(cfg.multiplierValues) };     break;
      case TileType.LockedPos:   tiles[i] = { type: TileType.LockedPos,   value: rng.int(...cfg.lockedPositiveRange) }; break;
      case TileType.LockedNeg:   tiles[i] = { type: TileType.LockedNeg,   value: rng.int(...cfg.lockedNegativeRange) }; break;
      case TileType.LockedBlank: tiles[i] = { type: TileType.LockedBlank, value: 0 };                                  break;
      case TileType.EntryGate:   tiles[i] = { type: TileType.EntryGate,   value: 0, allowedEntryDirections: buildEntryDirs(path, i, gridSize, rng) }; break;
      case TileType.LockedEntry: tiles[i] = { type: TileType.LockedEntry, value: 0, allowedEntryDirections: buildEntryDirs(path, i, gridSize, rng) }; break;
      case TileType.ExitGate:    tiles[i] = { type: TileType.ExitGate,    value: 0, allowedExitDirections:  buildExitDirs(path, i, gridSize, rng) };  break;
      case TileType.LockedExit:  tiles[i] = { type: TileType.LockedExit,  value: 0, allowedExitDirections:  buildExitDirs(path, i, gridSize, rng) };  break;
      case TileType.Checkpoint:  tiles[i] = { type: TileType.Checkpoint,  minimumEnergyRequired: 0 }; break; // threshold set in step 3d
      default:                   tiles[i] = { type: TileType.Blank };
    }
  }

  return tiles;
}

// ── 3c helper: analytically compute the value the slack tile needs ─────────────
//
// The slack tile is the "magic" tile that makes the path sum to exactly 0 energy.
// We simulate two partial paths:
//   - From start up to (but not including) the slack tile  →  energyBeforeSlack
//   - From after the slack tile to the end                 →  energyDriftAfterSlack
//
// The slack tile's value must be:  -(energyBeforeSlack + energyDriftAfterSlack)
// i.e. exactly the amount needed to counteract everything that comes after it.

function computeSlackTileValue(
  tiles: Array<Tile | null>,
  slackIndex: number,
  positiveRange: [number, number],
): number | null {
  // Simulate energy from start up to (but not onto) the slack tile
  let energy = tiles[0]!.value!; // start energy = face value of first tile
  for (let i = 1; i < slackIndex; i++) {
    energy -= 1; // each move costs 1 energy
    if (tiles[i]!.type !== TileType.Checkpoint) energy = applyTileEnergy(energy, tiles[i]!);
    if (energy < 0) return null; // path is already invalid before the slack tile
  }

  const energyJustBeforeSlack = energy - 1; // pay the move cost to step onto slack
  if (energyJustBeforeSlack < 0) return null;

  // Simulate energy drift from after the slack tile to the end
  // (pretend the slack contributes 0 — we add its real value back at the end)
  let energyDriftAfterSlack = energyJustBeforeSlack;
  for (let i = slackIndex + 1; i < tiles.length; i++) {
    energyDriftAfterSlack -= 1;
    if (tiles[i]!.type !== TileType.Checkpoint) energyDriftAfterSlack = applyTileEnergy(energyDriftAfterSlack, tiles[i]!);
    if (energyDriftAfterSlack < -100_000) break; // runaway safety guard
  }

  // The slack value that makes total final energy == 0
  const requiredValue = -energyDriftAfterSlack;
  const [lo, hi]      = positiveRange;

  return (requiredValue >= lo && requiredValue <= hi) ? requiredValue : null;
}

// ── 3d helper: simulate full energy trace ─────────────────────────────────────

function computeEnergyTrace(tiles: Array<Tile | null>): number[] {
  let energy      = tiles[0]!.value!;
  const trace     = [energy];

  for (let i = 1; i < tiles.length; i++) {
    energy -= 1;
    if (tiles[i]!.type !== TileType.Checkpoint) energy = applyTileEnergy(energy, tiles[i]!);
    trace.push(energy);
  }

  return trace;
}

// ── 3d helper: set checkpoint thresholds based on the actual energy trace ──────

function assignCheckpointThresholds(
  tiles: Array<Tile | null>,
  checkpointIndices: Set<number>,
  energyAtEachStep: number[],
  checkpointRange: [number, number],
  rng: Rng,
): boolean {
  for (const idx of checkpointIndices) {
    const energyOnArrival = energyAtEachStep[idx]; // energy after paying the move cost
    if (energyOnArrival <= 0) return false;

    // Threshold must be <= actual energy (so the path is valid) but within the configured range
    const [rangeLo, rangeHi] = checkpointRange;
    const maxThreshold       = Math.min(rangeHi, energyOnArrival);
    const minThreshold       = Math.min(rangeLo, maxThreshold);
    if (minThreshold <= 0) return false;

    tiles[idx] = { type: TileType.Checkpoint, minimumEnergyRequired: rng.int(minThreshold, maxThreshold) };
  }
  return true;
}

// ── 3e helper: optionally lock the highest +N tile for extra difficulty ─────────

function maybePromoteLargestPositiveToLocked(
  tiles: Array<Tile | null>,
  cfg: GeneratorConfig,
  rng: Rng,
): void {
  if (rng.float() >= cfg.lockBiggestPositiveProb) return;
  if (cfg.lockThreshold <= 0) return;

  // Find the highest-value positive tile that appears after the lock threshold
  const eligibleIndices = Array.from({ length: tiles.length }, (_, i) => i)
    .filter(i => tiles[i]?.type === TileType.Positive && i !== 0 && i >= cfg.lockThreshold);

  if (!eligibleIndices.length) return;

  const highestIdx = eligibleIndices.reduce((best, i) =>
    (tiles[i]!.value ?? 0) > (tiles[best]!.value ?? 0) ? i : best
  );

  tiles[highestIdx] = { type: TileType.LockedPos, value: tiles[highestIdx]!.value };
}

// ── 3f helper: walk the path and verify every rule holds ──────────────────────

function validatePathIsWinnable(tiles: Array<Tile | null>, path: Pos[]): boolean {
  let energy = tileStartEnergy(tiles[0]!);
  if (energy <= 0) return false;

  for (let step = 1; step < path.length; step++) {
    const prevTile = tiles[step - 1]!;
    const thisTile = tiles[step]!;

    // Exit gate: the direction we're leaving from must be allowed
    if (prevTile.allowedExitDirections) {
      const dir = directionBetween(path[step - 1], path[step]);
      if (!prevTile.allowedExitDirections.includes(dir)) return false;
    }

    // Entry gate: the direction we're arriving from must be allowed
    if (thisTile.allowedEntryDirections) {
      const dir = directionBetween(path[step - 1], path[step]);
      if (!thisTile.allowedEntryDirections.includes(dir)) return false;
    }

    energy -= 1; // pay the movement cost
    if (energy < 0) return false;

    if (thisTile.type === TileType.Checkpoint) {
      if (energy < (thisTile.minimumEnergyRequired ?? 0)) return false;
      // Checkpoint doesn't change energy — just checks it
    } else {
      energy = applyTileEnergy(energy, thisTile);
      if (energy < 0) return false;
    }
  }

  return energy === 0; // must finish with exactly 0
}

// ── 3g helper: place the flat tiles array into a 2D row/col grid ──────────────

function arrangeTilesIntoGrid(tiles: Array<Tile | null>, path: Pos[], gridSize: number): Tile[][] {
  const grid: Tile[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ({ type: TileType.Blank } as Tile))
  );
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    grid[r][c]   = tiles[i]!;
  }
  return grid;
}

// ─── Solver (iterative DFS) ───────────────────────────────────────────────────
//
// Used to verify that exactly `targetSolutions` valid solutions exist.
// We stop as soon as we find `maxSolutions + 1` to keep it fast.

interface SolverState {
  pos:      Pos;
  visited:  Set<string>;
  energy:   number;
  moves:    number;
  path:     Pos[];
  lastTile: Tile; // needed to enforce exit-gate constraints on the next step
}

function findSolutions(
  grid: Tile[][],
  gridSize: number,
  lockThreshold: number,
  maxSolutions = 2,
  minEnergyFloor = 1,
  forceStartPos?: Pos,
): Position[][] {
  const totalCells = gridSize * gridSize;
  const solutions: Position[][] = [];

  const startPositions: Pos[] = forceStartPos
    ? [forceStartPos]
    : Array.from({ length: gridSize }, (_, r) =>
        Array.from({ length: gridSize }, (_, c) => [r, c] as Pos)
      ).flat();

  for (const startPos of startPositions) {
    const startTile = grid[startPos[0]][startPos[1]];
    if (!tileIsValidStart(startTile)) continue;

    const startingEnergy = tileStartEnergy(startTile);
    if (startingEnergy <= 0) continue;

    const initialState: SolverState = {
      pos:      startPos,
      visited:  new Set([key(startPos)]),
      energy:   startingEnergy,
      moves:    0,
      path:     [startPos],
      lastTile: startTile,
    };
    const stack: SolverState[] = [initialState];

    while (stack.length) {
      const { pos, visited, energy, moves, path, lastTile } = stack.pop()!;

      // All cells visited — check if we finished with exactly 0 energy
      if (visited.size === totalCells) {
        if (energy === 0) solutions.push(path as Position[]);
        if (solutions.length >= maxSolutions) return solutions;
        continue;
      }

      const exitGateConstraint = lastTile.allowedExitDirections ?? null;

      for (const nextPos of neighboursOf(pos, gridSize)) {
        if (visited.has(key(nextPos))) continue;

        // Exit gate: we can only leave in allowed directions
        if (exitGateConstraint) {
          if (!exitGateConstraint.includes(directionBetween(pos, nextPos))) continue;
        }

        const nextTile = grid[nextPos[0]][nextPos[1]];

        // Entry gate: we can only enter from allowed directions
        if (nextTile.allowedEntryDirections) {
          if (!nextTile.allowedEntryDirections.includes(directionBetween(pos, nextPos))) continue;
        }

        // Locked tiles: can't enter until enough moves have been made
        if (tileIsLocked(nextTile) && moves < lockThreshold) continue;

        const energyAfterMoving = energy - 1; // each move costs 1
        if (energyAfterMoving < 0) continue;

        // Checkpoint: must arrive with enough energy (doesn't change energy)
        if (nextTile.type === TileType.Checkpoint) {
          if (energyAfterMoving < (nextTile.minimumEnergyRequired ?? 0)) continue;
        }

        const energyAfterTile = nextTile.type === TileType.Checkpoint
          ? energyAfterMoving
          : applyTileEnergy(energyAfterMoving, nextTile);

        if (energyAfterTile < 0) continue;

        // Pruning: if energy is already too low or impossibly high mid-path, skip
        const cellsRemaining = totalCells - visited.size - 1;
        if (cellsRemaining > 0 && energyAfterTile < minEnergyFloor)   continue;
        if (cellsRemaining > 0 && energyAfterTile > cellsRemaining * 8) continue;

        stack.push({
          pos:      nextPos,
          visited:  new Set([...visited, key(nextPos)]),
          energy:   energyAfterTile,
          moves:    moves + 1,
          path:     [...path, nextPos],
          lastTile: nextTile,
        });
      }
    }
  }

  return solutions;
}

// Solve a copy of the grid with all timing locks removed.
// Used to verify that locks are actually constraining — if removing them
// doesn't produce more solutions, the locks are cosmetic and we reject the puzzle.

function findSolutionsIgnoringLocks(grid: Tile[][], gridSize: number, maxSolutions = 2, minEnergyFloor = 1): Position[][] {
  const unlockedGrid = grid.map(row => row.map((tile): Tile => {
    switch (tile.type) {
      case TileType.LockedPos:   return { type: TileType.Positive,  value: tile.value };
      case TileType.LockedNeg:   return { type: TileType.Negative,  value: tile.value };
      case TileType.LockedBlank: return { type: TileType.Blank };
      case TileType.LockedEntry: return { type: TileType.EntryGate, value: tile.value, allowedEntryDirections: tile.allowedEntryDirections };
      case TileType.LockedExit:  return { type: TileType.ExitGate,  value: tile.value, allowedExitDirections:  tile.allowedExitDirections };
      default:                   return tile;
    }
  }));
  return findSolutions(unlockedGrid, gridSize, 0, maxSolutions, minEnergyFloor);
}

// ─── Energy trace (for stats and quality checks) ──────────────────────────────

function traceEnergyAlongSolution(grid: Tile[][], solution: Position[]): number[] {
  const firstTile = grid[solution[0][0]][solution[0][1]];
  let   energy    = tileStartEnergy(firstTile);
  const trace     = [energy];

  for (let i = 1; i < solution.length; i++) {
    energy -= 1;
    const tile = grid[solution[i][0]][solution[i][1]];
    if (tile.type !== TileType.Checkpoint) energy = applyTileEnergy(energy, tile);
    trace.push(energy);
  }

  return trace;
}

// ─── Anti-obviousness: find all tiles the player might think are valid starts ──

function findStartCandidates(grid: Tile[][], gridSize: number): Array<{ pos: Position; energy: number }> {
  const candidates: Array<{ pos: Position; energy: number }> = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const tile = grid[r][c];
      if (tileIsValidStart(tile)) {
        const energy = tileStartEnergy(tile);
        if (energy > 0) candidates.push({ pos: [r, c], energy });
      }
    }
  }

  return candidates.sort((a, b) => b.energy - a.energy); // highest energy first
}

// ─── PuzzleGenerator ──────────────────────────────────────────────────────────

export class PuzzleGenerator {
  constructor(private readonly cfg: GeneratorConfig) {}

  generate(difficulty: Level = Level.Medium): GeneratedPuzzle | null {
    const { cfg } = this;
    const rng     = createRng(cfg.seed);

    for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {

      // Step 1: generate a random path that visits every cell exactly once
      const path = generateHamiltonianPath(cfg.gridSize, rng);
      if (!path) continue;

      // Step 2: assign tile types and values along that path
      const grid = buildGrid(path, cfg, rng);
      if (!grid) continue;

      // Step 3: reject if starting energy is too high (makes start tile too obvious)
      const startingEnergy = tileStartEnergy(grid[path[0][0]][path[0][1]]);
      if (cfg.maxStartingEnergy !== undefined && startingEnergy > cfg.maxStartingEnergy) continue;

      // Step 4: verify the puzzle has exactly the right number of solutions
      const solutions = findSolutions(grid, cfg.gridSize, cfg.lockThreshold, cfg.targetSolutions + 1, cfg.minEnergyFloor);
      if (solutions.length !== cfg.targetSolutions) continue;

      const solution = solutions[0];
      const trace    = traceEnergyAlongSolution(grid, solution);

      // Step 5: reject if locked tiles don't appear on the solution path at all
      const hasLockedTiles = cfg.lockedCount + cfg.lockedBlankCount
                           + cfg.lockedEntryGateCount + cfg.lockedExitGateCount > 0;
      if (cfg.requireLocksMatter && hasLockedTiles) {
        const solutionUsesLocks = solution.slice(1).some(([r, c]) => tileIsLocked(grid[r][c]));
        if (!solutionUsesLocks) continue;
      }

      // Step 6: reject if energy never drops near zero (puzzle is too comfortable)
      const minimumEnergyMidPath = Math.min(...trace.slice(0, -1));
      if (cfg.tightEnergy && minimumEnergyMidPath > cfg.tightThreshold) continue;

      // Step 7: reject if the correct start tile is the most obvious one
      const startCandidates = findStartCandidates(grid, cfg.gridSize);
      if (startCandidates.length < cfg.minStartCandidates) continue;

      const correctStartEnergy = tileStartEnergy(grid[solution[0][0]][solution[0][1]]);
      const highestCandidateEnergy = startCandidates[0]?.energy ?? 0;
      if (cfg.banStartOnMaxTile && correctStartEnergy === highestCandidateEnergy) continue;

      // Step 8: verify locks actually constrain the puzzle (expensive — run last)
      if (cfg.requireLocksMatter && hasLockedTiles) {
        const solutionsWithoutLocks = findSolutionsIgnoringLocks(grid, cfg.gridSize, cfg.targetSolutions + 1, cfg.minEnergyFloor);
        if (solutionsWithoutLocks.length <= cfg.targetSolutions) continue; // locks made no difference
      }

      // All checks passed — this is a good puzzle
      const tightSteps = trace.slice(0, -1).filter(e => e <= cfg.tightThreshold).length;

      return {
        grid,
        solution,
        trace,
        attempts: attempt,
        seed:     rng.seed,   // ← return the resolved seed
        stats: {
          minEnergy:  Math.min(...trace),
          maxEnergy:  Math.max(...trace),
          tightSteps,
          startPos:   solution[0],
        },
      };
    }

    return null; // ran out of attempts
  }

  toPuzzle(result: GeneratedPuzzle, id: string, difficulty: Level): Puzzle {
    return {
      id,
      difficulty,
      gridSize:                 this.cfg.gridSize,
      movesNeededToUnlockTiles: this.cfg.lockThreshold,
      grid:                     result.grid,
      correctSolution:          result.solution,
      hintStartCell:            result.solution[0],
    };
  }
}

export function generatePuzzleWithSeed(
  preset: keyof typeof GENERATOR_PRESETS,
  seed?: number,
): { puzzle: Puzzle; seed: number } | null {
  const resolvedSeed = seed !== undefined ? seed : (Math.random() * 0xffffffff) >>> 0;
  const cfg = { ...GENERATOR_PRESETS[preset], seed: resolvedSeed };
  const gen = new PuzzleGenerator(cfg);

  const difficulty: Level =
    preset.includes('easy')   ? Level.Easy   :
    preset.includes('medium') ? Level.Medium :
    preset.includes('hard')   ? Level.Hard   : Level.Brutal;

  const result = gen.generate(difficulty);
  if (!result) return null;

  return {
    puzzle: gen.toPuzzle(result, `${preset}_${Date.now()}`, difficulty),
    seed:   result.seed,
  };
}