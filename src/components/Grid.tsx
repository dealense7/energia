import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Cell } from './Cell';
import { GameState, Position } from '../engine/types';

interface GridProps {
  state: GameState;
  shakingCell: string | null;
  showHint: boolean;
  onCellPress: (row: number, col: number) => void;
  nextCellToVisit?: Position | null;
}

export const Grid: React.FC<GridProps> = ({ state, shakingCell, showHint, onCellPress, nextCellToVisit }) => {
  const { width }  = useWindowDimensions();
  const { puzzle, visitedCells, pathSoFar, playerPosition, lockedTilesAreUnlocked } = state;
  const { grid, gridSize, correctSolution } = puzzle;

  const PADDING   = 32;
  const GAP       = gridSize === 3 ? 8 : 6;
  const cellSize  = Math.floor((width - PADDING * 2 - GAP * (gridSize - 1)) / gridSize);

  const hintCell = showHint
    ? (() => {
        for (const coord of correctSolution) {
          const [r, c] = coord;
          if (!visitedCells[r][c]) {
            return coord;
          }
        }
        return null;
      })()
    : null;

  return (
    <View style={[styles.grid, { gap: GAP, paddingHorizontal: PADDING }]}>
      {grid.map((row, r) => (
        <View key={r} style={[styles.row, { gap: GAP }]}>
          {row.map((tile, c) => {
            const visited    = visitedCells[r][c];
            const isCurrent  = playerPosition?.[0] === r && playerPosition?.[1] === c;
            const isHint     = hintCell?.[0] === r && hintCell?.[1] === c;
            // stepNumber is the order this cell was visited (1-based), shown as breadcrumb
            const stepNumber = visited ? pathSoFar.findIndex(p => p[0] === r && p[1] === c) + 1 : null;

            const isNextToVisit = nextCellToVisit && nextCellToVisit[0] === r && nextCellToVisit[1] === c;
            const disabledInTutorial = !!(nextCellToVisit && !isNextToVisit && !isCurrent);
            return (
              <Cell
                key={`${r}-${c}`}
                tile={tile}
                row={r}
                col={c}
                isVisited={visited}
                isCurrent={!!isCurrent}
                isNextHint={!!isHint}
                tilesUnlocked={lockedTilesAreUnlocked}
                stepNumber={stepNumber}
                onPress={onCellPress}
                isShaking={shakingCell === `${r}-${c}`}
                size={cellSize}
                isNextToVisit={!!isNextToVisit}
                disabledInTutorial={disabledInTutorial}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { alignSelf: 'stretch' },
  row:  { flexDirection: 'row', justifyContent: 'center' },
});