import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';

import { Colors, Spacing, Radius } from '../constants/theme';
import { GameState, GameStatus, TileType, Puzzle, Tile, Position } from '../engine/types';
import { createInitialGameState, movePlayerToCell, playerIsStuck } from '../engine/gameLogic';
import { generateTutorialPuzzle } from '../engine/tutorialPuzzleGenerator';
import { Strings } from '../constants/strings';

import { Grid } from '../components/Grid';
import { EnergyBar, EnergyFlash } from '../components/EnergyBar';
import { Controls } from '../components/Controls';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';

const useGameSession = (
  onWin?: () => void
) => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationFailed, setGenerationFailed] = useState(false);

  const [game, setGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [shakingCell, setShakingCell] = useState<string | null>(null);
  const [energyFlash, setEnergyFlash] = useState<EnergyFlash>(null);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate the tutorial puzzle
  const regenerate = useCallback(() => {
    setIsGenerating(true);
    setGenerationFailed(false);
    setPuzzle(null);
    setGame(null);
    setHistory([]);

    setTimeout(() => {
      try {
        const { puzzle: generated } = generateTutorialPuzzle();
        setPuzzle(generated);
        setGame(createInitialGameState(generated));
        setIsGenerating(false);
      } catch (e) {
        console.error('Failed to generate tutorial puzzle:', e);
        setIsGenerating(false);
        setGenerationFailed(true);
      }
    }, 50);
  }, []);

  // Initial generation
  useEffect(() => { regenerate(); }, [regenerate]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const flashEnergy = useCallback((type: EnergyFlash) => {
    setEnergyFlash(type);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setEnergyFlash(null), 600);
  }, []);

  // Cell tap handler
  const handleCellTap = useCallback(
    (row: number, col: number) => {
      if (!game || game.status === GameStatus.Won) return;

      const next = movePlayerToCell(game, [row, col]);
      if (!next) {
        setShakingCell(`${row}-${col}`);
        setTimeout(() => setShakingCell(null), 400);
        return;
      }

      const tile = puzzle!.grid[row][col];
      if (tile.type === TileType.Multiplier) {
        flashEnergy('mul');
      } else {
        const delta = next.currentEnergy - game.currentEnergy;
        if (delta > 0) flashEnergy('gain');
        else if (delta < 0) flashEnergy('loss');
      }

      setHistory((h) => [...h, game]);
      setGame(next);

      if (next.status === GameStatus.Won) {
        setTimeout(() => {
          onWin?.();
        }, 300);
      }
    },
    [game, puzzle, flashEnergy, onWin]
  );

  const undoMove = useCallback(() => {
    if (!history.length) return;
    setGame(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }, [history]);

  const resetPuzzle = useCallback(() => {
    if (!puzzle) return;
    setGame(createInitialGameState(puzzle));
    setHistory([]);
  }, [puzzle]);

  return {
    isGenerating,
    generationFailed,
    puzzle,
    game,
    history,
    shakingCell,
    setShakingCell,
    energyFlash,
    handleCellTap,
    undoMove,
    resetPuzzle,
    regenerate,
  };
};

export const TutorialGameScreen: React.FC = () => {
  const router = useRouter();
  const {
    isGenerating,
    generationFailed,
    puzzle,
    game,
    history,
    shakingCell,
    setShakingCell,
    energyFlash,
    handleCellTap,
    undoMove,
    resetPuzzle,
    regenerate,
  } = useGameSession(() => {
    router.replace('/howto');
  });

  const [currentTooltip, setCurrentTooltip] = useState<string>('');
  const [nextCellToVisit, setNextCellToVisit] = useState<Position | null>(null);

  // Calculate current tooltip and next cell based on game progress
  useEffect(() => {
    if (!puzzle || !game) return;

    const { pathSoFar, visitedCells } = game;
    const { tooltips } = Strings.tutorial;
    const { correctSolution } = puzzle;

    // Highlight the next cell in the solution
    if (pathSoFar.length < correctSolution.length) {
      setNextCellToVisit(correctSolution[pathSoFar.length]);
    } else {
      setNextCellToVisit(null);
    }

    let tooltip = '';

    // Show different tips based on progress
    if (pathSoFar.length === 0) {
      tooltip = tooltips.startRule;
    } else if (pathSoFar.length === 1) {
      tooltip = tooltips.secondRule;
    } else if (pathSoFar.length === 2) {
      tooltip = tooltips.thirdRule;
    } else if (pathSoFar.length === 3) {
      tooltip = tooltips.multiplier;
    } else if (pathSoFar.length === 4) {
      tooltip = tooltips.fourthrule;
    } else if (pathSoFar.length === 5) {
      tooltip = tooltips.drain;
    } else if (pathSoFar.length === 6) {
      tooltip = tooltips.allTiles;
    } else if (pathSoFar.length >= 7) {
      // Count unvisited cells
      let unvisitedCount = 0;
      visitedCells.forEach(row => {
        row.forEach(visited => {
          if (!visited) unvisitedCount++;
        });
      });
      if (unvisitedCount > 0) {
        tooltip = tooltips.finish;
      }
    }

    setCurrentTooltip(tooltip);
  }, [puzzle, game?.pathSoFar?.length]);

  // Wrapper for handleCellTap to apply tutorial restrictions
  const handleTutorialCellTap = useCallback(
    (row: number, col: number) => {
      // In tutorial mode: only allow visiting the next cell in the solution
      if (nextCellToVisit && (nextCellToVisit[0] !== row || nextCellToVisit[1] !== col)) {
        setShakingCell(`${row}-${col}`);
        setTimeout(() => setShakingCell(null), 400);
        return;
      }
      // Allow the normal tap to proceed
      handleCellTap(row, col);
    },
    [nextCellToVisit, handleCellTap, setShakingCell]
  );

  if (isGenerating) {
    return <LoadingScreen difficulty="Tutorial" onBack={() => router.push('/')} />;
  }

  if (generationFailed || !puzzle || !game) {
    return <ErrorScreen onRetry={() => regenerate()} onBack={() => router.push('/')} />;
  }


  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/')}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>{Strings.nav.back}</Text>
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <Text style={styles.titleText}>{Strings.tutorial.title}</Text>
        </View>

        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >

        <EnergyBar
          energy={game.currentEnergy}
          movesMade={game.totalMovesMade}
          tilesUnlocked={game.lockedTilesAreUnlocked}
          movesUntilUnlock={0}
          flash={energyFlash}
          playUnlockAnim={false}
          isPlaying={game.status === GameStatus.Playing}
        />

        {/* Current lesson/tip banner */}
        {currentTooltip && (
          <View style={styles.tooltipBanner}>
            <Text style={styles.tooltipText}>{currentTooltip}</Text>
          </View>
        )}

        {/* Grid without individual tooltips */}
        <Grid
          state={game}
          shakingCell={shakingCell}
          showHint={false}
          onCellPress={handleTutorialCellTap}
          nextCellToVisit={nextCellToVisit}
        />

        {playerIsStuck(game) && (
          <View style={styles.stuckBanner}>
            <Text style={styles.stuckText}>{Strings.game.stuckBanner}</Text>
          </View>
        )}

        <Controls onUndo={undoMove} onRegenerate={() => regenerate()} onReset={resetPuzzle} canUndo={history.length > 0} />

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  backBtn: { minWidth: 60 },
  backText: {
    color: Colors.textPrimary,
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'Light',
  },
  titleCol: { alignItems: 'center', gap: 2, flex: 1, marginHorizontal: Spacing.sm },
  titleText: {
    fontSize: 16,
    letterSpacing: 2,
    color: Colors.gold,
    fontFamily: 'Bold',
  },
  spacer: { minWidth: 60 },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  messageBanner: {
    backgroundColor: '#1a2a40',
    borderWidth: 1,
    borderColor: Colors.blue,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successBanner: {
    backgroundColor: '#1a3a2a',
    borderColor: Colors.green,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: 13,
    letterSpacing: 0.5,
    fontFamily: 'Regular',
    flex: 1,
  },
  successText: {
    color: Colors.green,
    fontFamily: 'Bold',
  },
  dismissBanner: {
    padding: 4,
    marginLeft: Spacing.md,
  },
  dismissText: {
    color: Colors.textMuted,
    fontSize: 16,
  },

  tooltipBanner: {
    backgroundColor: '#2a3a50',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    width: '90%',
    marginVertical: Spacing.md,
  },
  tooltipText: {
    color: Colors.gold,
    fontSize: 14,
    letterSpacing: 0.5,
    fontFamily: 'Regular',
    textAlign: 'center',
    lineHeight: 18,
  },

  stuckBanner: {
    backgroundColor: '#3a1a1a',
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    width: '90%',
  },
  stuckText: {
    color: Colors.red,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
  },
  idleHint: {
    textAlign: 'center',
    color: Colors.textDim,
    fontSize: 13,
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
    paddingVertical: 8,
  },
});
