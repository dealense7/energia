import { Tile, TileType, Direction } from './types';

// ─── Tile classification ──────────────────────────────────────────────────────
// All "what kind of tile is this?" logic lives here, close to the tile definition.
// Components and game logic import these instead of doing their own type checks.

const LOCKED_TILE_TYPES = new Set([
  TileType.LockedPos,
  TileType.LockedNeg,
  TileType.LockedBlank,
  TileType.LockedEntry,
  TileType.LockedExit,
]);

export const tileIsLocked       = (tile: Tile) => LOCKED_TILE_TYPES.has(tile.type);
export const tileIsEntryGate    = (tile: Tile) => tile.type === TileType.EntryGate || tile.type === TileType.LockedEntry;
export const tileIsExitGate     = (tile: Tile) => tile.type === TileType.ExitGate  || tile.type === TileType.LockedExit;
export const tileIsCheckpoint   = (tile: Tile) => tile.type === TileType.Checkpoint;
export const tileIsMultiplier   = (tile: Tile) => tile.type === TileType.Multiplier;
export const tileIsValidStart   = (tile: Tile) => tile.type === TileType.Positive && (tile.value ?? 0) > 0;

// ─── Energy calculation ───────────────────────────────────────────────────────
// How much energy does this tile give/take, AFTER the 1-energy move cost is paid?

export function applyTileEnergyEffect(energyOnArrival: number, tile: Tile): number {
  if (tileIsCheckpoint(tile)) return energyOnArrival;            // no effect
  if (tileIsMultiplier(tile)) return energyOnArrival * (tile.value ?? 1);
  return energyOnArrival + (tile.value ?? 0);                    // add / subtract / zero
}

// ─── Direction helpers ────────────────────────────────────────────────────────

const DIRECTION_ARROW: Record<Direction, string> = {
  [Direction.Up]:    '↑',
  [Direction.Down]:  '↓',
  [Direction.Left]:  '←',
  [Direction.Right]: '→',
};

export function directionBetween(from: [number, number], to: [number, number]): Direction | null {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  if (dr === -1) return Direction.Up;
  if (dr === 1)  return Direction.Down;
  if (dc === -1) return Direction.Left;
  if (dc === 1)  return Direction.Right;
  return null;
}

// ─── Tile display label ───────────────────────────────────────────────────────
// Returns the text shown inside a tile on the grid.

export function tileLabel(tile: Tile, isCurrentlyLocked: boolean): string {
  if (isCurrentlyLocked) {
    return tile.type === TileType.LockedBlank
      ? '🔒'
      : `🔒${tileLabel({ ...tile, type: unlockedVariant(tile.type) }, false)}`;
  }

  switch (tile.type) {
    case TileType.Blank:
    case TileType.LockedBlank:
      return '';

    case TileType.Positive:
    case TileType.LockedPos:
      return `+${tile.value}`;

    case TileType.Negative:
    case TileType.LockedNeg:
      return `${tile.value}`;

    case TileType.Multiplier:
      return `×${tile.value}`;

    case TileType.EntryGate:
    case TileType.LockedEntry: {
      const arrows = (tile.allowedEntryDirections ?? []).map((d) => DIRECTION_ARROW[d]).join('');
      const bonus  = tile.value ? ` ${tile.value > 0 ? '+' : ''}${tile.value}` : '';
      return `in${arrows}${bonus}`;
    }

    case TileType.ExitGate:
    case TileType.LockedExit: {
      const arrows = (tile.allowedExitDirections ?? []).map((d) => DIRECTION_ARROW[d]).join('');
      const bonus  = tile.value ? ` ${tile.value > 0 ? '+' : ''}${tile.value}` : '';
      return `ex${arrows}${bonus}`;
    }

    case TileType.Checkpoint:
      return `≥${tile.minimumEnergyRequired}`;

    default:
      return '';
  }
}

// Returns the unlocked variant of a locked tile type (for label rendering)
function unlockedVariant(type: TileType): TileType {
  const map: Partial<Record<TileType, TileType>> = {
    [TileType.LockedPos]:   TileType.Positive,
    [TileType.LockedNeg]:   TileType.Negative,
    [TileType.LockedEntry]: TileType.EntryGate,
    [TileType.LockedExit]:  TileType.ExitGate,
  };
  return map[type] ?? type;
}

// ─── Tile visual styling ──────────────────────────────────────────────────────

const TILE_STYLE: Record<TileType, { bg: string; accent: string }> = {
  [TileType.Blank]:       { bg: '#1e2433', accent: '#4a5568' },
  [TileType.Positive]:    { bg: '#1a3a2a', accent: '#4ade80' },
  [TileType.Negative]:    { bg: '#3a1a1a', accent: '#f87171' },
  [TileType.Multiplier]:  { bg: '#2e2a10', accent: '#fbbf24' },
  [TileType.LockedPos]:   { bg: '#1a3a2a', accent: '#4ade80' },
  [TileType.LockedNeg]:   { bg: '#3a1a1a', accent: '#f87171' },
  [TileType.LockedBlank]: { bg: '#1e2433', accent: '#4a5568' },
  [TileType.EntryGate]:   { bg: '#1a2a3a', accent: '#60a5fa' },
  [TileType.LockedEntry]: { bg: '#1a2a3a', accent: '#60a5fa' },
  [TileType.ExitGate]:    { bg: '#2a1a3a', accent: '#c084fc' },
  [TileType.LockedExit]:  { bg: '#2a1a3a', accent: '#c084fc' },
  [TileType.Checkpoint]:  { bg: '#2e2010', accent: '#fb923c' },
};

const FALLBACK_STYLE = { bg: '#1e2433', accent: '#4a5568' };

export function tileStyle(tile: Tile) {
  return TILE_STYLE[tile.type] ?? FALLBACK_STYLE;
}