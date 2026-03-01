import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, StyleSheet,
   ScrollView, Platform, StatusBar, Animated,
   Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { GameState, GameStatus, TileType, Puzzle } from '../engine/types';
import { createInitialGameState, movePlayerToCell, playerIsStuck } from '../engine/gameLogic';
import { generatePuzzle } from '../engine/puzzleGenerator';
import { Strings } from '../constants/strings';
import { Grid } from '../components/Grid';
import { EnergyBar, EnergyFlash } from '../components/EnergyBar';
import { Controls } from '../components/Controls';

// ─── Difficulty → preset key ──────────────────────────────────────────────────

const PRESET_FOR_DIFFICULTY = {
  easy:   'easy_3x3',
  medium: 'medium_4x4',
  hard:   'hard_4x4',
  brutal: 'brutal_5x5',
} as const;

// ─── Loading screen ───────────────────────────────────────────────────────────

const LoadingScreen: React.FC<{ difficulty: string; onBack: () => void }> = ({ difficulty, onBack }) => {
  const pulse  = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Pulse the bolt
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse,  { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(pulse,  { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();

  }, []);
  const randomFact = Strings.funFacts[Math.floor(Math.random() * Strings.funFacts.length)];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>{Strings.nav.back}</Text>
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={styles.diffTag}>{difficulty.toUpperCase()}</Text>
        </View>
        <View style={{ minWidth: 60 }} />
      </View>

      <View style={styles.loadingContainer}>

        {/* Pulsing bolt in the center */}
        <Animated.View style={{ opacity: pulse }}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
        </Animated.View>

        <Text style={styles.loadingTitle}>Generating</Text>
        <Text style={styles.loadingSubtitle}>Building takes time, here is a fun fact:</Text>
        <Text style={[styles.loadingSubtitle, styles.funFact]}>{randomFact}</Text>
      </View>
    </SafeAreaView>
  );
};

// ─── Error screen ─────────────────────────────────────────────────────────────

const ErrorScreen: React.FC<{ onRetry: () => void; onBack: () => void }> = ({ onRetry, onBack }) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingTitle}>Happens rarely..</Text>
      <Text style={styles.loadingSubtitle}>Try generating again, it might work this time.</Text>
      <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg }}>
        <TouchableOpacity style={styles.backBtnStyle}onPress={onBack}>
          <Text style={styles.backText}>{Strings.nav.home}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>{Strings.nav.retry}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

// ─── Game screen ──────────────────────────────────────────────────────────────

export const GameScreen: React.FC = () => {
  const router = useRouter();
  const { difficulty = 'easy' } = useLocalSearchParams<{ difficulty: string }>();

  const [puzzle,         setPuzzle]         = useState<Puzzle | null>(null);
  const [isGenerating,   setIsGenerating]   = useState(true);
  const [generationFailed, setGenerationFailed] = useState(false);

  const [game,           setGame]           = useState<GameState | null>(null);
  const [history,        setHistory]        = useState<GameState[]>([]);
  const [shakingCell,    setShakingCell]    = useState<string | null>(null);
  const [energyFlash,    setEnergyFlash]    = useState<EnergyFlash>(null);
  const [showHint,       setShowHint]       = useState(false);
  const [playUnlockAnim, setPlayUnlockAnim] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // track when the current round started so we can show elapsed time on win
  const startTimeRef = useRef<number>(Date.now());

  const generateAndStart = useCallback(() => {
    setIsGenerating(true);
    setGenerationFailed(false);
    setPuzzle(null);
    setGame(null);
    setHistory([]);
 
    setTimeout(() => {
      const key = PRESET_FOR_DIFFICULTY[difficulty as keyof typeof PRESET_FOR_DIFFICULTY] ?? 'easy_3x3';
      const generated = generatePuzzle(key);

      if (!generated) {
        setIsGenerating(false);
        setGenerationFailed(true);
        return;
      }

      setPuzzle(generated);
      setGame(createInitialGameState(generated));
      // reset timer
      startTimeRef.current = Date.now();
      setIsGenerating(false);
    }, 50); // 50ms delay is enough for the loading UI to paint
  }, [difficulty]);

  // Generate on mount
  useEffect(() => { generateAndStart(); }, []);

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const flashEnergy = useCallback((type: EnergyFlash) => {
    setEnergyFlash(type);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setEnergyFlash(null), 600);
  }, []);

  // determine whether hints may be shown given the current state
  const isHintAllowed = useCallback(() => {
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

  const toggleHint = useCallback(() => {
    setShowHint(h => (isHintAllowed() ? !h : false));
  }, [isHintAllowed]);

  // ── Show loading / error states before puzzle is ready ────────────────────
  if (isGenerating) {
    return <LoadingScreen difficulty={difficulty} onBack={() => router.push('/')} />;
  }

  if (generationFailed || !puzzle || !game) {
    return <ErrorScreen onRetry={generateAndStart} onBack={() => router.push('/')} />;
  }

  // ── Puzzle is ready — render the game ─────────────────────────────────────

  const handleCellTap = (row: number, col: number) => {
    if (game.status === GameStatus.Won) return;

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

    const tile = puzzle.grid[row][col];
    if (tile.type === TileType.Multiplier) {
      flashEnergy('mul');
    } else {
      const delta = next.currentEnergy - game.currentEnergy;
      if (delta > 0) flashEnergy('gain');
      else if (delta < 0) flashEnergy('loss');
    }

    setHistory(h => [...h, game]);

    setGame(next);
    updateHintMode(next);
    

    if (next.status === GameStatus.Won) {
      const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const leftEnergy = next.currentEnergy;
      setTimeout(() => {
        router.replace(
          `/win?time=${elapsedSec}&gridSize=${puzzle.gridSize}&difficulty=${difficulty}&leftEnergy=${leftEnergy}`
        );
      }, 300);
    }
  };


  const updateHintMode = (next: GameState) => {
      const path = next.pathSoFar;
      const solution = puzzle.correctSolution;

      for (let i = 0; i < path.length; i++) {
        if (i >= solution.length || path[i][0] !== solution[i][0] || path[i][1] !== solution[i][1]) {
          return setShowHint(false);
        }
      }
  }

  const undoMove = () => {
    if (!history.length) return;
    setGame(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
  };

  const resetPuzzle = () => {
    setGame(createInitialGameState(puzzle));
    setHistory([]);
  };

  const movesUntilUnlock = Math.max(0, puzzle.movesNeededToUnlockTiles - game.totalMovesMade);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Fixed header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>{Strings.nav.back}</Text>
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <Text style={styles.diffTag}>{puzzle.difficulty.toUpperCase()}</Text>
          <Text style={styles.puzzleId}>{puzzle.id}</Text>
        </View>

        <TouchableOpacity onPress={toggleHint} style={styles.hintBtn}>
          <Text style={styles.hintText}>{showHint ? Strings.nav.hideHint : Strings.nav.hint}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Scrollable game content ── */}
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
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    backgroundColor:   Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  backBtn:  { minWidth: 60 },
  backText: { color: Colors.textPrimary, fontSize: 14, letterSpacing: 1, fontFamily: 'Rajdhani' },
  titleCol: { alignItems: 'center', gap: 2, flex: 1, marginHorizontal: Spacing.sm },
  diffTag:  { fontSize: 12, letterSpacing: 3, color: Colors.gold, fontFamily: 'SpaceMono' },
  puzzleId: { fontSize: 10, color: '#334155', fontFamily: 'SpaceMono' },
  hintBtn:  { borderWidth: 1, borderColor: '#334155', borderRadius: Radius.sm, paddingVertical: 4, paddingHorizontal: 10, minWidth: 60, alignItems: 'center' },
  hintText: { color: Colors.gold, fontSize: 12, letterSpacing: 1, fontFamily: 'Rajdhani' },

  // ── Scroll content ───────────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1, alignItems: 'center',
    gap: Spacing.lg, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxl,
  },

  // ── Loading screen ───────────────────────────────────────────────────────────
  loadingContainer: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  spinRing: {
    position:     'absolute',
    width:        110,
    height:       110,
    borderRadius: 55,
    borderWidth:  2,
    borderColor:  Colors.gold,
    borderStyle:  'dashed',
    opacity:      0.4,
  },
  loadingBolt: {
    fontSize:   52,
    marginBottom: 8,
  },
  loadingTitle: {
    fontSize:      18,
    fontFamily:    'Bold',
    color:         Colors.gold,
    letterSpacing: 4,
  },
  loadingSubtitle: {
    fontSize:      12,
    fontFamily:    'Light',
    color:         Colors.textMuted,
    letterSpacing: 1,
  },
  funFact: {
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    fontFamily: 'Regular',
  },
  loadingWarning: {
    fontSize:      12,
    fontFamily:    'Rajdhani',
    color:         Colors.red,
    letterSpacing: 1,
    marginTop:     Spacing.sm,
    opacity:       0.8,
  },

  // ── Error screen ─────────────────────────────────────────────────────────────
  errorIcon: { fontSize: 48 },
  retryBtn: {
    backgroundColor:   Colors.gold,
    paddingVertical:   12,
    paddingHorizontal: 32,
    borderRadius:      Radius.lg,
    marginTop:         Spacing.md,
  },
  backBtnStyle: {
    backgroundColor:   Colors.borderDark,
    paddingVertical:   12,
    paddingHorizontal: 32,
    borderRadius:      Radius.lg,
    marginTop:         Spacing.md,
  },
  retryText: { color: '#060d1a', fontSize: 16, fontFamily: 'RajdhaniBold', letterSpacing: 2 },

  // ── Game screen ───────────────────────────────────────────────────────────────
  stuckBanner: {
    backgroundColor: '#3a1a1a', borderWidth: 1, borderColor: Colors.red,
    borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg, width: '90%',
  },
  stuckText: { color: Colors.red, fontSize: 13, letterSpacing: 1, textAlign: 'center', fontFamily: 'SpaceMono' },
  idleHint:  { textAlign: 'center', color: Colors.textDim, fontSize: 13, letterSpacing: 2, fontFamily: 'SpaceMono', paddingVertical: 8 },
});