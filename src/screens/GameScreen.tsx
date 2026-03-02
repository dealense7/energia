import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { View,Text,TouchableOpacity,StyleSheet,ScrollView,Platform,StatusBar} from 'react-native';

import { Colors, Spacing, Radius } from '../constants/theme';
import { GameState, GameStatus, TileType, Puzzle } from '../engine/types';
import { createInitialGameState, movePlayerToCell, playerIsStuck } from '../engine/gameLogic';
import { generatePuzzleWithSeed } from '../engine/puzzleGenerator';
import { Strings } from '../constants/strings';

import { Grid } from '../components/Grid';
import { EnergyBar, EnergyFlash } from '../components/EnergyBar';
import { Controls } from '../components/Controls';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';

// Custom Hook – some game logic lives here
const PRESET_FOR_DIFFICULTY: Record<string, string> = { easy: 'easy_3x3', medium: 'medium_4x4', hard: 'hard_4x4', brutal: 'brutal_5x5'};

const useGameSession = (
  difficulty: string,
  initialSeed?: number,
  onWin?: (params: {
    time: number;
    leftEnergy: number;
    gridSize: number;
    difficulty: string;
    seed?: number;
  }) => void
) => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationFailed, setGenerationFailed] = useState(false);

  const [game, setGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);

  const [shakingCell, setShakingCell] = useState<string | null>(null);
  const [energyFlash, setEnergyFlash] = useState<EnergyFlash>(null);
  const [showHint, setShowHint] = useState(false);
  const [playUnlockAnim, setPlayUnlockAnim] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Generate / Regenerate
  const regenerate = useCallback(() => {
    setIsGenerating(true);
    setGenerationFailed(false);
    setPuzzle(null);
    setGame(null);
    setHistory([]);
    setElapsedTime(0);
    setShowHint(false);

    setTimeout(() => {
      const key = PRESET_FOR_DIFFICULTY[difficulty] ?? 'easy_3x3';
      const generated = generatePuzzleWithSeed(key, initialSeed );

      console.log(generated?.seed)
      
      if (!generated) {
        setIsGenerating(false);
        setGenerationFailed(true);
        return;
      }

      setPuzzle(generated.puzzle);
      setSeed(generated.seed);
      setGame(createInitialGameState(generated.puzzle));
      startTimeRef.current = Date.now();
      setIsGenerating(false);
    }, 50);
  }, [difficulty]);

  // Initial generation
  useEffect(() => { regenerate(); }, [regenerate]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Elapsed time timer
  useEffect(() => {
    if (!puzzle || !game || game.status === GameStatus.Won) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [puzzle, game?.status]);

  const flashEnergy = useCallback((type: EnergyFlash) => {
    setEnergyFlash(type);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setEnergyFlash(null), 600);
  }, []);

  // Hint logic
  const canHint = useMemo(() => {
    if (!game || !puzzle) return false;
    const path = game.pathSoFar;
    const solution = puzzle.correctSolution;

    for (let i = 0; i < path.length; i++) {
      if (i >= solution.length || path[i][0] !== solution[i][0] || path[i][1] !== solution[i][1]) {
        return false;
      }
    }
    return true;
  }, [game, puzzle]);

  useEffect(() => {
    if (!canHint) setShowHint(false);
  }, [canHint]);

  const toggleHint = useCallback(() => {
    setShowHint((h) => (canHint ? !h : false));
  }, [canHint]);

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

      if (!game.lockedTilesAreUnlocked && next.lockedTilesAreUnlocked) {
        setPlayUnlockAnim(true);
        setTimeout(() => setPlayUnlockAnim(false), 1500);
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
        const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const leftEnergy = next.currentEnergy;
        const gridSize = puzzle!.gridSize;

      setTimeout(() => {
        onWin?.({ time: elapsedSec, leftEnergy, gridSize, difficulty, seed: seed! }); // ← add seed
      }, 300);
      }
    },
    [game, puzzle, flashEnergy, onWin, difficulty]
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
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    setShowHint(false);
  }, [puzzle]);


  // Maybe in futurer, we can have can save game if player will win
  const saveCurrentPuzzle = useCallback(async () => {
    if (!puzzle) return;

    try {
      const saveKey = `saved_puzzle_${difficulty}_${Date.now()}`;
      await AsyncStorage.setItem(saveKey, JSON.stringify(puzzle));

      Alert.alert('✅ Puzzle Saved', 'You can load it later from your saved puzzles.');
    } catch (e) {
      Alert.alert('❌ Save Failed', 'Please try again.');
    }
  }, [puzzle, difficulty]);

  return {
    isGenerating,
    generationFailed,
    puzzle,
    game,
    history,
    shakingCell,
    energyFlash,
    showHint,
    playUnlockAnim,
    elapsedTime,
    handleCellTap,
    toggleHint,
    undoMove,
    resetPuzzle,
    regenerate,
    saveCurrentPuzzle,
  };
};


// Main Component
export const GameScreen: React.FC = () => {
  const router = useRouter();
  const { difficulty = 'easy', seedNumber } = useLocalSearchParams<{
    difficulty: string;
    seedNumber?: string;
  }>();

  const {
    isGenerating,
    generationFailed,
    puzzle,
    game,
    history,
    shakingCell,
    energyFlash,
    showHint,
    playUnlockAnim,
    elapsedTime,
    handleCellTap,
    toggleHint,
    undoMove,
    resetPuzzle,
    regenerate,
    saveCurrentPuzzle,
  } = useGameSession(difficulty, seedNumber ? Number(seedNumber) : undefined, (winParams) => {
    router.replace(
      `/win?time=${winParams.time}&gridSize=${winParams.gridSize}&difficulty=${winParams.difficulty}&leftEnergy=${winParams.leftEnergy}&seed=${winParams.seed}`
    );
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const movesUntilUnlock = puzzle && game
    ? Math.max(0, puzzle.movesNeededToUnlockTiles - game.totalMovesMade)
    : 0;

  if (isGenerating) {
    return <LoadingScreen difficulty={difficulty} onBack={() => router.push('/')} />;
  }

  if (generationFailed || !puzzle || !game) {
    return <ErrorScreen onRetry={regenerate} onBack={() => router.push('/')} />;
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
          <Text style={styles.diffTag}>{puzzle.difficulty.toUpperCase()}</Text>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.rightControls}>
          <TouchableOpacity onPress={toggleHint} style={styles.hintBtn}>
            <Text style={styles.hintText}>
              {showHint ? Strings.nav.hideHint : Strings.nav.hint}
            </Text>
          </TouchableOpacity>
        </View>
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
          movesUntilUnlock={movesUntilUnlock}
          flash={energyFlash}
          playUnlockAnim={playUnlockAnim}
          isPlaying={game.status === GameStatus.Playing}
        />

        <Grid
          state={game}
          shakingCell={shakingCell}
          showHint={showHint}
          onCellPress={handleCellTap}
        />

        {playerIsStuck(game) && (
          <View style={styles.stuckBanner}>
            <Text style={styles.stuckText}>{Strings.game.stuckBanner}</Text>
          </View>
        )}

        <Controls onUndo={undoMove} onReset={resetPuzzle} canUndo={history.length > 0} />

        {game.status === GameStatus.Idle && (
          <Text style={styles.idleHint}>{Strings.game.idlePrompt}</Text>
        )}
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
  diffTag: {
    fontSize: 12,
    letterSpacing: 3,
    color: Colors.gold,
    fontFamily: 'Regular',
  },
  timerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Light',
    letterSpacing: 1,
  },

  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: Radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  actionText: {
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'Regular',
  },
  hintBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: Radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  hintText: {
    color: Colors.gold,
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: 'Regular',
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
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