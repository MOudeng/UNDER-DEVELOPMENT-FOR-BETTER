import { STEP_ASSETS } from "../data/levels";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Home,
  Play,
  RotateCcw,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TriangleBackground from "../components/TriangleBackground";
import { useProfiles } from "../context/ProfileContext";
import { useCompletionSound } from "../hooks/useCompletionSound";
import { TimerService } from "../services";
import LocalDatabaseService from "../services/LocalDatabaseService";
import { Color, FontFamily, Gradient, Shadow } from "../styles/globalstyle";
import { createPracticeBatch } from "../utils/practicePatterns";

type Choice = "test" | "practice";

type SearchParams = {
  choice?: Choice;
};

type Phase = "idle" | "running" | "ready";

type ExitTarget = "back" | "home";

type StepResult = {
  step: number;
  player1Time: number;
  durationMs: number;
  player2Time: number;
  mode: "single";
};

const TOTAL_STEPS = 8;

const PATTERN_VARIANTS = STEP_ASSETS.map((stepAssets) =>
  stepAssets.map((asset, index) => ({ asset, variant: "abcdefgh"[index] })),
);

const randomizeStepChoices = () =>
  PATTERN_VARIANTS.map(
    (variants) => variants[Math.floor(Math.random() * variants.length)],
  );

const upsertResult = (results: StepResult[], nextResult: StepResult) => {
  const existingIndex = results.findIndex(
    (result) => result.step === nextResult.step,
  );
  if (existingIndex === -1) {
    return [...results, nextResult].sort((a, b) => a.step - b.step);
  }

  const nextResults = [...results];
  nextResults[existingIndex] = nextResult;
  return nextResults.sort((a, b) => a.step - b.step);
};

export default function GameplayPage() {
  const { width, height } = useWindowDimensions();
  const { activeProfile, isGuest } = useProfiles();
  const { choice = "test" } = useLocalSearchParams<SearchParams>();

  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState(1);
  const currentLevelId = ((currentStep - 1) % TOTAL_STEPS) + 1;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const stepStartedAtRef = useRef<number | null>(null);
  const isAdvancingRef = useRef(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const savedSteps = useRef(new Set<number>());
  const sessionIdPromiseRef = useRef<Promise<string | null> | null>(null);
  const sessionFinishedRef = useRef(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playPatternComplete = useCompletionSound("pattern");

  const [stepChoices, setStepChoices] = useState(() =>
    choice === "practice"
      ? createPracticeBatch(PATTERN_VARIANTS)
      : randomizeStepChoices(),
  );
  const { asset: currentImage, variant: currentVariant } =
    stepChoices[currentStep - 1];
  const isLastStep = choice === "test" && currentStep === TOTAL_STEPS;
  const choiceLabel = choice === "test" ? "TEST" : "PRACTICE / SIMULASI";
  const isLandscape = width > height;
  const landscapeBodyWidth = Math.min(320, Math.max(200, width * 0.28));
  const landscapePatternSize = Math.min(360, Math.max(160, height - 150));

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1400);
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  const getElapsedDurationMs = useCallback(() => {
    if (stepStartedAtRef.current === null) return 0;
    return Math.max(0, Date.now() - stepStartedAtRef.current);
  }, []);

  const persistCurrentStep = useCallback(async (durationMs: number) => {
    if (isGuest || (choice === "test" && savedSteps.current.has(currentStep))) {
      return;
    }

    try {
      const sessionId = await sessionIdPromiseRef.current;
      if (!sessionId) throw new Error("Sesi permainan belum siap.");
      await LocalDatabaseService.savePatternResult({
        sessionId,
        patternId: `level-${currentLevelId}-step-${currentStep}`,
        levelNumber: currentLevelId,
        patternVariant: currentVariant,
        durationMs,
        replaceExisting: choice === "practice",
      });
    } catch (error) {
      Alert.alert(
        "Riwayat gagal disimpan",
        error instanceof Error
          ? error.message
          : "Penyimpanan lokal bermasalah. Silakan coba lagi.",
      );
      throw error;
    }
    savedSteps.current.add(currentStep);
  }, [choice, currentLevelId, currentStep, currentVariant, isGuest]);

  const finishGame = useCallback(async (finalResults: StepResult[]) => {
    const totalDurationMs = finalResults.reduce(
      (total, result) => total + Math.max(0, result.durationMs),
      0,
    );
    try {
      if (!isGuest) {
        const sessionId = await sessionIdPromiseRef.current;
        if (!sessionId) throw new Error("Sesi permainan belum siap.");
        await LocalDatabaseService.finishGameSession(sessionId, totalDurationMs);
      }
      sessionFinishedRef.current = true;
    } catch (error) {
      Alert.alert(
        "Sesi gagal diselesaikan",
        error instanceof Error
          ? error.message
          : "Riwayat belum tersimpan. Silakan coba lagi.",
      );
      throw error;
    }

    // Replace, not push: a finished game left underneath the results is what
    // "Main Lagi" followed by exit used to land on, with no working buttons.
    router.replace({
      pathname: "/data-analisa",
      params: {
        results: JSON.stringify(finalResults),
        choice,
      },
    });
  }, [choice, isGuest]);

  useEffect(() => {
    if (sessionIdPromiseRef.current) return;
    if (isGuest) {
      sessionIdPromiseRef.current = Promise.resolve(null);
      return;
    }
    if (!activeProfile) {
      sessionIdPromiseRef.current = Promise.resolve(null);
      Alert.alert("Pilih profil", "Pilih atau buat profil sebelum mulai bermain.", [
        { text: "Pilih Profil", onPress: () => router.replace("/profiles") },
      ]);
      return;
    }

    sessionIdPromiseRef.current = LocalDatabaseService.beginGameSession(
      activeProfile.id,
      choice,
      "manual_completion",
    ).catch((error) => {
      Alert.alert(
        "Sesi gagal dibuat",
        error instanceof Error
          ? error.message
          : "Penyimpanan lokal bermasalah. Riwayat tidak dapat disimpan.",
      );
      return null;
    });
  }, [activeProfile, choice, isGuest]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const updateTimer = () => {
      setElapsedSeconds(Math.floor(getElapsedDurationMs() / 1000));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 250);

    return () => clearInterval(timer);
  }, [getElapsedDurationMs, phase]);

  const startStep = () => {
    stepStartedAtRef.current = Date.now();
    isAdvancingRef.current = false;
    setElapsedSeconds(0);
    setPhase("running");
  };

  const moveToStep = (step: number) => {
    if (step > stepChoices.length) {
      setStepChoices((choices) => [
        ...choices,
        ...createPracticeBatch(PATTERN_VARIANTS),
      ]);
    }
    setCurrentStep(step);
    stepStartedAtRef.current = Date.now();
    setElapsedSeconds(0);
    isAdvancingRef.current = false;
    setPhase("running");
  };

  const buildCurrentResult = (attemptDurationMs: number): StepResult => {
    const previousDurationMs =
      choice === "practice"
        ? results.find((result) => result.step === currentStep)?.durationMs ?? 0
        : 0;
    const durationMs = previousDurationMs + attemptDurationMs;
    return {
      step: currentStep,
      player1Time: durationMs / 1000,
      durationMs,
      player2Time: 0,
      mode: "single",
    };
  };

  const handleNextStep = async () => {
    if (phase !== "running" || isAdvancingRef.current) {
      return;
    }

    isAdvancingRef.current = true;
    setPhase("ready");

    const durationMs = getElapsedDurationMs();
    const result = buildCurrentResult(durationMs);
    const nextResults = upsertResult(results, result);

    try {
      await persistCurrentStep(result.durationMs);
      setResults(nextResults);

      if (isLastStep) {
        // The results screen plays the session fanfare as this screen closes.
        await finishGame(nextResults);
        return;
      }

      void playPatternComplete();
      showFeedback(`Pola ${currentStep} selesai.`);
      moveToStep(currentStep + 1);
    } catch {
      isAdvancingRef.current = false;
      setPhase("running");
    }
  };

  const handlePracticeNavigation = async (targetStep: number) => {
    if (
      choice !== "practice" ||
      phase !== "running" ||
      isAdvancingRef.current ||
      targetStep < 1
    ) {
      return;
    }

    isAdvancingRef.current = true;
    setPhase("ready");

    const durationMs = getElapsedDurationMs();
    const result = buildCurrentResult(durationMs);
    const nextResults = upsertResult(results, result);

    try {
      await persistCurrentStep(result.durationMs);
      if (targetStep > currentStep) void playPatternComplete();
      showFeedback(
        isGuest ? `Pola ${currentStep} selesai.` : `Waktu pola ${currentStep} tersimpan.`,
      );
      setResults(nextResults);
      moveToStep(targetStep);
    } catch {
      isAdvancingRef.current = false;
      setPhase("running");
    }
  };

  const handleFinishPractice = async () => {
    if (choice !== "practice" || phase !== "running" || isAdvancingRef.current) {
      return;
    }

    isAdvancingRef.current = true;
    setPhase("ready");
    const durationMs = getElapsedDurationMs();
    const result = buildCurrentResult(durationMs);
    const nextResults = upsertResult(results, result);

    try {
      await persistCurrentStep(result.durationMs);
      setResults(nextResults);
      await finishGame(nextResults);
    } catch {
      isAdvancingRef.current = false;
      setPhase("running");
    }
  };

  const cancelCurrentSession = useCallback(async () => {
    const sessionId = await sessionIdPromiseRef.current;
    if (sessionId && !sessionFinishedRef.current) {
      await LocalDatabaseService.cancelGameSession(sessionId);
    }
  }, []);

  const exitGame = useCallback(async (target: ExitTarget) => {
    try {
      isAdvancingRef.current = true;
      setPhase("ready");
      await cancelCurrentSession();
      if (target === "home") {
        router.dismissTo("/main/home");
      } else {
        router.back();
      }
    } catch (error) {
      isAdvancingRef.current = false;
      setPhase("running");
      Alert.alert(
        "Gagal keluar",
        error instanceof Error ? error.message : "Silakan coba lagi.",
      );
    }
  }, [cancelCurrentSession]);

  const requestExit = useCallback((target: ExitTarget) => {
    if (isAdvancingRef.current) return;
    Alert.alert(
      "Keluar dari permainan?",
      "Progres sesi yang belum selesai tidak akan disimpan.",
      [
        { text: "Lanjut bermain", style: "cancel" },
        {
          text: target === "home" ? "Ke Beranda" : "Keluar",
          style: "destructive",
          onPress: () => void exitGame(target),
        },
      ],
    );
  }, [exitGame]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        requestExit("back");
        return true;
      },
    );
    return () => subscription.remove();
  }, [requestExit]);

  const restartPractice = useCallback(() => {
    if (choice !== "practice" || (!activeProfile && !isGuest)) return;

    Alert.alert(
      "Mulai ulang latihan?",
      "Progres latihan ini akan dihapus dan pola akan diacak kembali.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Mulai Ulang",
          onPress: async () => {
            try {
              isAdvancingRef.current = true;
              setPhase("ready");
              await cancelCurrentSession();
              sessionFinishedRef.current = false;
              sessionIdPromiseRef.current = activeProfile
                ? LocalDatabaseService.beginGameSession(
                    activeProfile.id,
                    "practice",
                    "manual_completion",
                  )
                : Promise.resolve(null);
              savedSteps.current.clear();
              setResults([]);
              setStepChoices(createPracticeBatch(PATTERN_VARIANTS));
              setCurrentStep(1);
              setElapsedSeconds(0);
              stepStartedAtRef.current = null;
              isAdvancingRef.current = false;
              setPhase("idle");
              showFeedback("Latihan dimulai ulang dengan pola baru.");
            } catch (error) {
              isAdvancingRef.current = false;
              setPhase("running");
              Alert.alert(
                "Latihan gagal dimulai ulang",
                error instanceof Error ? error.message : "Silakan coba lagi.",
              );
            }
          },
        },
      ],
    );
  }, [activeProfile, cancelCurrentSession, choice, isGuest, showFeedback]);

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
            <TriangleBackground />

            <View style={styles.headerTopRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
                onPress={() => requestExit("back")}
              >
                <ArrowLeft
                  color={Color.colorOrangered}
                  size={20}
                  strokeWidth={2.4}
                />
              </Pressable>

              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>
                  {choice === "test"
                    ? `Pola ${currentStep} dari ${TOTAL_STEPS}`
                    : `Pola ${currentStep}`}
                </Text>
                <Text style={styles.headerSubtitle}>{choiceLabel}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kembali ke Beranda"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.homeButton,
                  pressed && styles.backButtonPressed,
                ]}
                onPress={() => requestExit("home")}
              >
                <Home
                  color={Color.colorOrangered}
                  size={17}
                  strokeWidth={2.4}
                />
                <Text style={styles.homeButtonText}>Beranda</Text>
              </Pressable>
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
            {feedback ? (
              <View style={styles.feedbackBanner}>
                <CheckCircle2 color="#16a34a" size={17} />
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.bodyCard,
              isLandscape && styles.landscapeBodyCard,
              isLandscape && { width: landscapeBodyWidth },
            ]}
          >
            <TriangleBackground />

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
                <View style={styles.practiceControls}>
                  <View style={styles.practiceActionRow}>
                    <Pressable
                      disabled={currentStep === 1}
                      style={({ pressed }) => [
                        styles.navigationPracticeButton,
                        currentStep === 1 && styles.disabledButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => handlePracticeNavigation(currentStep - 1)}
                    >
                      <ArrowLeft color={Color.colorOrangered} size={19} />
                      <Text style={styles.navigationPracticeLabel}>Sebelumnya</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryWideButton,
                        styles.practiceActionButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => handlePracticeNavigation(currentStep + 1)}
                    >
                      <Text style={styles.practiceActionLabel}>Berikutnya</Text>
                      <ArrowRight color={Color.colorWhite} size={19} />
                    </Pressable>
                  </View>

                  <View style={styles.practiceActionRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.navigationPracticeButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={restartPractice}
                    >
                      <RotateCcw color={Color.colorOrangered} size={18} />
                      <Text style={styles.navigationPracticeLabel}>Mulai Ulang</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryWideButton,
                        styles.practiceActionButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={handleFinishPractice}
                    >
                      <Text style={styles.practiceActionLabel}>Selesai Latihan</Text>
                    </Pressable>
                  </View>
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
  homeButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(219, 50, 14, 0.08)",
  },
  homeButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.interSemiBold,
    color: Color.colorOrangered,
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
  feedbackBanner: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 4,
  },
  feedbackText: {
    color: "#15803d",
    fontFamily: FontFamily.interSemiBold,
    fontSize: 12,
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
  practiceControls: {
    width: "100%",
    gap: 10,
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
  navigationPracticeButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 75,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Color.colorOrangered,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  navigationPracticeLabel: {
    color: Color.colorOrangered,
    fontFamily: FontFamily.interSemiBold,
    fontSize: 13,
  },
  disabledButton: { opacity: 0.35 },
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
