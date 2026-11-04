import { STEP_ASSETS } from "../data/levels";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, Play } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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
import { GUEST_STATISTICS_USER_ID } from "../services/HistoryManagementService";
import { Color, FontFamily, Gradient, Shadow } from "../styles/globalstyle";
import { saveLevelPerformance } from "../utils/performanceStorage";

type Choice = "test" | "practice";

type SearchParams = {
  choice?: Choice;
};

type Phase = "idle" | "running" | "ready";

type StepResult = {
  step: number;
  player1Time: number;
  player2Time: number;
  mode: "single";
};

const TOTAL_STEPS = 8;

const randomizeStepChoices = () =>
  STEP_ASSETS.map(
    (stepAssets) => stepAssets[Math.floor(Math.random() * stepAssets.length)],
  );

export default function GameplayPage() {
  const { width, height } = useWindowDimensions();
  const { user } = useUser();
  const { choice = "test" } = useLocalSearchParams<SearchParams>();

  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState(1);
  const currentLevelId = ((currentStep - 1) % TOTAL_STEPS) + 1;
  const currentLevel = LevelManagementService.getLevelById(currentLevelId);
  const timeLimit = currentLevel?.timeLimit || 60;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedSecondsRef = useRef(0);
  const isAdvancingRef = useRef(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const savedSteps = useRef(new Set<number>());
  const savedResults = useRef(new Set<number>());

  const stepChoices = useMemo(() => randomizeStepChoices(), []);
  const currentImage = stepChoices[(currentStep - 1) % TOTAL_STEPS];
  const isLastStep = choice === "test" && currentStep === TOTAL_STEPS;
  const choiceLabel = choice === "test" ? "TEST" : "PRACTICE / SIMULASI";
  const isLandscape = width > height;
  const landscapeBodyWidth = Math.min(320, Math.max(200, width * 0.28));
  const landscapePatternSize = Math.min(360, Math.max(160, height - 150));

  const saveResult = useCallback((result: StepResult) => {
    if (savedResults.current.has(result.step)) {
      return;
    }

    savedResults.current.add(result.step);
    setResults((prev) => [...prev, result]);
  }, []);

  const persistCurrentStep = useCallback(async (timeSpent: number) => {
    if (savedSteps.current.has(currentStep)) {
      return;
    }

    savedSteps.current.add(currentStep);
    const statisticsUserId = user.id ?? GUEST_STATISTICS_USER_ID;

    const scoringResult = ScoringEngine.createLevelCompletion({
      levelId: currentLevelId,
      levelTitle: currentLevel?.title || `Level ${currentLevelId}`,
      timeSpent,
      timeLimit,
      patternsCompleted: 1,
      userId: statisticsUserId,
    });

    await HistoryManagementService.savePerformance(
      statisticsUserId,
      scoringResult.gamePerformance,
    );
    if (user.id) {
      await HistoryManagementService.addPerformanceToSession(
        user.id,
        scoringResult.gamePerformance,
      );
    }

    if (choice === "test") {
      if (user.id) {
        await saveLevelPerformance(
          user.id,
          user.name,
          scoringResult.levelPerformance,
        );
      }
      await LevelManagementService.markLevelCompleted(currentLevelId);
    }

    if (user.id) {
      await SessionManager.logActivity(user.id, "level_complete", "gameplay", {
        levelId: currentStep,
        score: scoringResult.score,
        timeSpent,
        choice,
        mode: "single",
      });
    }
  }, [
    choice,
    currentLevel?.title,
    currentLevelId,
    currentStep,
    timeLimit,
    user.id,
    user.name,
  ]);

  const finishGame = useCallback(async (finalResults: StepResult[]) => {
    if (choice === "test") {
      const totalTimeSeconds = finalResults.reduce(
        (total, result) => total + result.player1Time,
        0,
      );
      await HistoryManagementService.saveCompletedTestSession(
        user.id ?? GUEST_STATISTICS_USER_ID,
        totalTimeSeconds,
      );
    }

    if (user.id) {
      HistoryManagementService.endSession(user.id);
      SessionManager.logActivity(user.id, "game_complete", "gameplay", {
        mode: "single",
        choice,
      });
    }

    router.push({
      pathname: "/data-analisa",
      params: {
        results: JSON.stringify(finalResults),
      },
    });
  }, [choice, user.id]);

  useEffect(() => {
    if (user.id) {
      HistoryManagementService.startSession(user.id);
      SessionManager.logActivity(user.id, "game_start", "gameplay", {
        mode: "single",
        choice,
      });
    }
  }, [choice, user.id]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const timer = setInterval(() => {
      const nextTime = elapsedSecondsRef.current + 1;
      elapsedSecondsRef.current = nextTime;
      setElapsedSeconds(nextTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const startStep = () => {
    elapsedSecondsRef.current = 0;
    isAdvancingRef.current = false;
    setElapsedSeconds(0);
    setPhase("running");
  };

  const handleNextStep = async () => {
    if (phase !== "running" || isAdvancingRef.current) {
      return;
    }

    isAdvancingRef.current = true;
    setPhase("ready");

    const timeSpent = elapsedSecondsRef.current;
    const result: StepResult = {
      step: currentStep,
      player1Time: timeSpent,
      player2Time: 0,
      mode: "single",
    };

    saveResult(result);

    if (isLastStep) {
      await persistCurrentStep(timeSpent);
      await finishGame([...results, result]);
      return;
    }

    elapsedSecondsRef.current = 0;
    setElapsedSeconds(0);
    setCurrentStep((step) => step + 1);
    isAdvancingRef.current = false;
    setPhase("running");
    await persistCurrentStep(timeSpent);
  };

  const handleFinishPractice = async () => {
    if (choice !== "practice" || phase !== "running" || isAdvancingRef.current) {
      return;
    }

    isAdvancingRef.current = true;
    setPhase("ready");

    const timeSpent = elapsedSecondsRef.current;
    const result: StepResult = {
      step: currentStep,
      player1Time: timeSpent,
      player2Time: 0,
      mode: "single",
    };

    saveResult(result);
    await persistCurrentStep(timeSpent);
    await finishGame([...results, result]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && styles.landscapeContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.headerCard, isLandscape && styles.landscapeHeaderCard]}
          >
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
                <Text style={styles.headerSubtitle}>{choiceLabel}</Text>
              </View>
            </View>

            <View
              style={[styles.patternCard, isLandscape && styles.landscapePatternCard]}
            >
              <View
                style={[
                  styles.patternFrame,
                  isLandscape && styles.landscapePatternFrame,
                  isLandscape && {
                    width: landscapePatternSize,
                    height: landscapePatternSize,
                  },
                ]}
              >
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

            <Text style={styles.timerText}>
              {TimerService.formatSeconds(elapsedSeconds)}
            </Text>
          </View>

          <View
            style={[
              styles.bodyCard,
              isLandscape && styles.landscapeBodyCard,
              isLandscape && { width: landscapeBodyWidth },
            ]}
          >
            <PatternBackground position="bottomLeft" opacity={0.12} />

            {phase === "idle" ? (
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
            ) : phase === "running" ? (
              choice === "practice" ? (
                <View style={styles.practiceActionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryWideButton,
                      styles.practiceActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleNextStep}
                  >
                    <View style={styles.actionInner}>
                      <Text style={styles.practiceActionLabel}>Next</Text>
                      <ArrowRight
                        color={Color.colorWhite}
                        size={20}
                        strokeWidth={2.5}
                      />
                    </View>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryWideButton,
                      styles.practiceActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleFinishPractice}
                  >
                    <View style={styles.actionInner}>
                      <Text style={styles.practiceActionLabel}>Selesai</Text>
                    </View>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.actionGroup}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryWideButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={handleNextStep}
                  >
                    <View style={styles.actionInner}>
                      <Text style={styles.actionLabelInside}>
                        {isLastStep ? "Selesai" : "Next"}
                      </Text>
                      <ArrowRight
                        color={Color.colorWhite}
                        size={22}
                        strokeWidth={2.5}
                      />
                    </View>
                  </Pressable>
                </View>
              )
            ) : null}
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
  landscapeContent: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
    paddingTop: 12,
    paddingBottom: 12,
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
  landscapeHeaderCard: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
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
  landscapePatternCard: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
  },
  patternFrame: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#111111",
    overflow: "hidden",
    backgroundColor: Color.colorWhite,
  },
  landscapePatternFrame: {
    flex: 0,
    alignSelf: "center",
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
  landscapeBodyCard: {
    width: 220,
    flex: 0,
    minHeight: 0,
    marginTop: 0,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  actionGroup: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  practiceActionRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  practiceActionButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  practiceActionLabel: {
    color: Color.colorWhite,
    fontFamily: FontFamily.interSemiBold,
    fontSize: 15,
    lineHeight: 20,
    marginRight: 6,
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
