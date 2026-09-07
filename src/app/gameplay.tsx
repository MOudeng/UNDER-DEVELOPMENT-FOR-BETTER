import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Play } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../components/PatternBackground";
import { useUser } from "../context/UserContext";
import {
  HistoryManagementService,
  LevelManagementService,
  ScoringEngine,
  SessionManager,
  TimerService,
} from "../services";
import { Color, FontFamily, Gradient, Shadow } from "../styles/globalstyle";
import { saveLevelPerformance } from "../utils/performanceStorage";

type Mode = "single" | "double";
type Choice = "test" | "practice";

type SearchParams = {
  mode?: Mode;
  choice?: Choice;
};

type Phase = "idle" | "running" | "ready";

type StepResult = {
  step: number;
  player1Time: number;
  player2Time: number;
  mode: Mode;
};

const TOTAL_STEPS = 8;

const STEP_ASSETS = [
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 1a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 1b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 1c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 1d.png"),
  ],
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 2a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 2b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 2c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 2d.png"),
  ],
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 3a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 3b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 3c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 3d.png"),
  ],
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 4a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 4b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 4c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 4d.png"),
  ],
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 5a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 5b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 5c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 5d.png"),
  ],
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 6a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 6b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 6c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 6d.png"),
  ],
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 7a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 7b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 7c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 7d.png"),
  ],
  [
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 8a.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 8b.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 8c.png"),
    require("../assets/TEST_RANDOM_OTAK_ATIK/Lvl 8d.png"),
  ],
] as const;

const randomizeStepChoices = () =>
  STEP_ASSETS.map(
    (stepAssets) => stepAssets[Math.floor(Math.random() * stepAssets.length)],
  );

const formatTime = (seconds: number) => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);

  const minutes = Math.floor(absSeconds / 60)
    .toString()
    .padStart(2, "0");

  const remainingSeconds = (absSeconds % 60).toString().padStart(2, "0");

  return `${isNegative ? "-" : ""}${minutes}:${remainingSeconds}`;
};

const PLAYER_LABELS = ["Pemain 1", "Pemain 2"] as const;

export default function GameplayPage() {
  const { user } = useUser();
  const { mode = "single", choice = "test" } =
    useLocalSearchParams<SearchParams>();

  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState(1);
  const currentLevel = LevelManagementService.getLevelById(currentStep);
  const timeLimit = currentLevel?.timeLimit || 60;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepElapsedSeconds, setStepElapsedSeconds] = useState(0);
  const [playerTimes, setPlayerTimes] = useState([0, 0]);
  const [finishedPlayers, setFinishedPlayers] = useState([false, false]);
  const [results, setResults] = useState<StepResult[]>([]);
  const savedSteps = useRef(new Set<number>());
  const savedResults = useRef(new Set<number>());

  const stepChoices = useMemo(() => randomizeStepChoices(), []);
  const currentImage = stepChoices[currentStep - 1];
  const isLastStep = currentStep === TOTAL_STEPS;
  const modeLabel = mode === "single" ? "1 PLAYER" : "2 PLAYER";
  const choiceLabel = choice === "test" ? "TEST" : "PRACTICE / SIMULASI";
  const isDoubleMode = mode === "double";

  const saveResult = useCallback((result: StepResult) => {
    if (savedResults.current.has(result.step)) {
      return;
    }

    savedResults.current.add(result.step);
    setResults((prev) => [...prev, result]);
  }, []);

  const persistCurrentStep = useCallback(async () => {
    if (!user.id || savedSteps.current.has(currentStep)) {
      return;
    }

    savedSteps.current.add(currentStep);
    const singleTimeSpent = stepElapsedSeconds;
    const doubleTimeSpent = Math.max(playerTimes[0] || 0, playerTimes[1] || 0);
    const timeSpent = isDoubleMode
      ? Math.max(0, doubleTimeSpent)
      : singleTimeSpent;

    const scoringResult = ScoringEngine.createLevelCompletion({
      levelId: currentStep,
      levelTitle: currentLevel?.title || `Level ${currentStep}`,
      timeSpent,
      timeLimit,
      patternsCompleted: 1,
      userId: user.id,
    });

    await HistoryManagementService.savePerformance(
      user.id,
      scoringResult.gamePerformance,
    );
    await HistoryManagementService.addPerformanceToSession(
      user.id,
      scoringResult.gamePerformance,
    );

    if (choice === "test") {
      await saveLevelPerformance(
        user.id,
        user.name,
        scoringResult.levelPerformance,
      );
      await LevelManagementService.markLevelCompleted(currentStep);
    }

    await SessionManager.logActivity(user.id, "level_complete", "gameplay", {
      levelId: currentStep,
      score: scoringResult.score,
      timeSpent,
      choice,
      mode,
    });
  }, [
    choice,
    currentLevel?.title,
    currentStep,
    isDoubleMode,
    mode,
    playerTimes,
    stepElapsedSeconds,
    timeLimit,
    user.id,
    user.name,
  ]);

  useEffect(() => {
    if (user.id) {
      HistoryManagementService.startSession(user.id);
      SessionManager.logActivity(user.id, "game_start", "gameplay", {
        mode,
        choice,
      });
    }
  }, [choice, mode, user.id]);

  useEffect(() => {
    setStepElapsedSeconds(0);
    setPlayerTimes([0, 0]);
    setFinishedPlayers([false, false]);
  }, [currentStep]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const timer = setInterval(() => {
      if (isDoubleMode) {
        setPlayerTimes((prev) =>
          prev.map((time, index) =>
            finishedPlayers[index] ? time : time + 1,
          ),
        );
      } else {
        setElapsedSeconds((time) => time + 1);
        setStepElapsedSeconds((time) => time + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, finishedPlayers, isDoubleMode]);

  useEffect(() => {
    if (
      phase === "running" &&
      isDoubleMode &&
      finishedPlayers[0] &&
      finishedPlayers[1]
    ) {
      saveResult({
        step: currentStep,
        player1Time: playerTimes[0],
        player2Time: playerTimes[1],
        mode,
      });

      setPhase("ready");
    }
  }, [
    currentStep,
    finishedPlayers,
    isDoubleMode,
    mode,
    phase,
    playerTimes,
    saveResult,
  ]);

  useEffect(() => {
    if (phase === "ready") {
      persistCurrentStep();
    }
  }, [phase, persistCurrentStep]);

  const startStep = () => {
    if (currentStep === 1 && phase === "idle") {
      setElapsedSeconds(0);
    }
    setStepElapsedSeconds(0);
    setPlayerTimes([0, 0]);
    setFinishedPlayers([false, false]);
    setPhase("running");
  };

  const finishStep = () => {
    saveResult({
      step: currentStep,
      player1Time: stepElapsedSeconds,
      player2Time: 0,
      mode,
    });

    setPhase("ready");
  };

  const handlePlayerFinish = (playerIndex: number) => {
    setFinishedPlayers((prev) => {
      const updated = [...prev];

      if (!updated[playerIndex]) {
        updated[playerIndex] = true;
      }

      return updated;
    });
  };

  const finishGame = () => {
    if (user.id) {
      HistoryManagementService.endSession(user.id);
      SessionManager.logActivity(user.id, "game_complete", "gameplay", {
        mode,
        choice,
      });
    }

    if (choice === "test") {
      router.push({
        pathname: "/data-analisa",
        params: {
          results: JSON.stringify(results),
        },
      });
      return;
    }

    router.push("/main/home");
  };

  const goNextStep = () => {
    if (isLastStep) {
      finishGame();
      return;
    }

    setCurrentStep((step) => step + 1);
    setPhase("idle");
  };

  const actionLabel =
    phase === "idle"
      ? "Mulai"
      : phase === "running"
        ? "Selesai"
        : isLastStep
          ? "Selesai"
          : "Lanjutkan";

  const actionIcon =
    phase === "idle" ? (
      <Play
        color={Color.colorWhite}
        size={22}
        fill={Color.colorWhite}
        strokeWidth={2.5}
      />
    ) : phase === "running" ? (
      <CheckCircle2 color={Color.colorWhite} size={22} strokeWidth={2.5} />
    ) : (
      <ArrowRight color={Color.colorWhite} size={22} strokeWidth={2.5} />
    );

  const handleActionPress = () => {
    if (phase === "idle") {
      startStep();
      return;
    }

    if (phase === "running") {
      finishStep();
      return;
    }

    goNextStep();
  };

  const handleDoubleReadyAction = (action: "next" | "back") => {
    if (action === "back") {
      router.back();
      return;
    }

    goNextStep();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <PatternBackground
              position="topRight"
              opacity={0.2}
              rotate="180deg"
            />

            <View style={styles.headerTopRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
                onPress={() => router.back()}
              >
                <ArrowLeft
                  color={Color.colorOrangered}
                  size={20}
                  strokeWidth={2.4}
                />
              </Pressable>

              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>Pola - {currentStep}</Text>
                <Text style={styles.headerSubtitle}>
                  {modeLabel} • {choiceLabel}
                </Text>
              </View>
            </View>

            <View style={styles.patternCard}>
              <View style={styles.patternFrame}>
                {phase === "idle" ? (
                  <View style={styles.patternPlaceholder} />
                ) : (
                  <Image
                    style={styles.patternImage}
                    contentFit="contain"
                    source={currentImage}
                  />
                )}
              </View>
            </View>

            {isDoubleMode ? (
              <View style={styles.doubleTimerRow}>
                <Text style={styles.timerText}>
                  {formatTime(playerTimes[0])}
                </Text>

                <Text style={styles.timerText}>
                  {formatTime(playerTimes[1])}
                </Text>
              </View>
            ) : (
              <Text style={styles.timerText}>
                {TimerService.formatSeconds(elapsedSeconds)}
              </Text>
            )}
          </View>

          <View style={styles.bodyCard}>
            <PatternBackground position="bottomLeft" opacity={0.12} />

            {isDoubleMode ? (
              phase === "ready" ? (
                <View style={styles.doubleReadyActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.doubleNextButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleDoubleReadyAction("next")}
                  >
                    <Text style={styles.doubleNextButtonText}>Next</Text>
                    <ArrowRight
                      color={Color.colorWhite}
                      size={18}
                      strokeWidth={2.4}
                    />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.doubleBackButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleDoubleReadyAction("back")}
                  >
                    <ArrowLeft
                      color={Color.colorOrangered}
                      size={18}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.doubleBackButtonText}>Kembali</Text>
                  </Pressable>
                </View>
              ) : phase === "idle" ? (
                <View style={styles.actionGroup}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryWideButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={startStep}
                  >
                    <View style={styles.actionInner}>
                      <Text style={styles.actionLabelInside}>Mulai</Text>
                      <Play
                        color={Color.colorWhite}
                        size={22}
                        fill={Color.colorWhite}
                        strokeWidth={2.5}
                      />
                    </View>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.doubleActionGrid}>
                  {PLAYER_LABELS.map((playerLabel, index) => (
                    <Pressable
                      key={playerLabel}
                      style={({ pressed }) => [
                        styles.doublePlayerButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        if (phase === "running" && !finishedPlayers[index]) {
                          handlePlayerFinish(index);
                        }
                      }}
                    >
                      <View style={styles.doublePlayerButtonInner}>
                        <CheckCircle2
                          color={Color.colorWhite}
                          size={20}
                          strokeWidth={2.5}
                        />

                        <Text style={styles.doublePlayerButtonText}>
                          Selesai
                        </Text>
                      </View>
                      <Text style={styles.doublePlayerLabel}>
                        {playerLabel}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )
            ) : (
              <View style={styles.actionGroup}>
                <Pressable
                  style={({ pressed }) => [
                    phase === "ready"
                      ? styles.primaryWideButton
                      : styles.primaryCircleButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleActionPress}
                >
                  <View style={styles.actionInner}>
                    {phase === "ready" ? (
                      <>
                        <Text style={styles.actionLabelInside}>
                          {actionLabel}
                        </Text>
                        {actionIcon}
                      </>
                    ) : (
                      actionIcon
                    )}
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 18,
  },
  headerCard: {
    minHeight: 450,
    backgroundColor: Color.colorWhite,
    borderRadius: 34,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: Shadow.medium,
    overflow: "hidden",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(219, 50, 14, 0.08)",
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: FontFamily.interBold,
    color: Color.colorOrangered,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.interMedium,
    color: "#a28f8b",
  },
  patternCard: {
    minHeight: 300,
    borderRadius: 20,
    alignItems: "stretch",
    justifyContent: "center",
    backgroundColor: Color.colorWhite,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(231, 189, 183, 0.7)",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: Shadow.medium,
  },
  patternFrame: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Color.colorWhite,
  },
  patternImage: {
    width: "100%",
    height: "100%",
  },
  patternPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  timerText: {
    alignSelf: "center",
    color: Color.colorOrangered,
    fontFamily: FontFamily.interBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0.4,
  },
  bodyCard: {
    flex: 1,
    minHeight: 240,
    marginTop: 14,
    paddingHorizontal: 6,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  actionGroup: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  primaryCircleButton: {
    width: 75,
    height: 75,
    borderRadius: 999,
    backgroundColor: "#e11d0b",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: Shadow.medium,
  },
  primaryWideButton: {
    minHeight: 75,
    alignSelf: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#e11d0b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: Shadow.medium,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  actionInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabelInside: {
    color: Color.colorWhite,
    fontFamily: FontFamily.interSemiBold,
    fontSize: 16,
    lineHeight: 20,
    marginRight: 10,
  },
  actionText: {
    color: "#d10f0f",
    fontFamily: FontFamily.interSemiBold,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  doubleActionGrid: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
  doublePlayerButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: Color.colorOrangered,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: Shadow.medium,
  },
  doublePlayerButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  doublePlayerButtonText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.interSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  doublePlayerLabel: {
    marginTop: 10,
    color: "#a45a4b",
    fontFamily: FontFamily.interMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  doubleReadyActions: {
    width: "100%",
    gap: 10,
    paddingHorizontal: 46,
  },
  doubleNextButton: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: Gradient.cta[0],
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: Shadow.medium,
  },
  doubleNextButtonText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.interSemiBold,
    fontSize: 13,
    lineHeight: 16,
  },
  doubleBackButton: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: Color.colorWhite,
    borderWidth: 1,
    borderColor: "rgba(245, 80, 35, 0.18)",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: Shadow.low,
  },
  doubleBackButtonText: {
    color: Color.colorOrangered,
    fontFamily: FontFamily.interSemiBold,
    fontSize: 13,
    lineHeight: 16,
  },
  doubleTimerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
});
