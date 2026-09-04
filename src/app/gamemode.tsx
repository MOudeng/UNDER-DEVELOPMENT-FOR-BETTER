import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PatternBackground from "../components/PatternBackground";
import {
  BorderRadius,
  Color,
  FontFamily,
  Gradient,
  Shadow,
} from "../styles/globalstyle";

type Mode = "single" | "double";

type SearchParams = {
  mode?: Mode;
};

export default function GameModePage() {
  const { mode } = useLocalSearchParams<SearchParams>();

  const startChoice = (choice: "test" | "practice") => {
    router.push({
      pathname: "/gameplay",
      params: {
        mode: mode ?? "single",
        choice,
      },
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <PatternBackground
              position="topRight"
              opacity={0.22}
              rotate="180deg"
            />

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Ayo{`\n`}Mulai!</Text>
            </View>
          </View>

          <View style={styles.bodySection}>
            <Text style={styles.sectionLabel}>PILIH MODE PERMAINAN</Text>

            <View style={styles.cardList}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionCard,
                  pressed && styles.optionCardPressed,
                ]}
                onPress={() => startChoice("test")}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>TEST</Text>
                  <Text style={styles.optionDescription}>
                    Test adalah mode permainan dengan 8 level yang hasilnya akan
                    disimpan di database dan dianalisa.
                  </Text>
                </View>

                <View style={styles.chevronWrap}>
                  <ChevronRight
                    color={Color.colorOrangered}
                    size={24}
                    strokeWidth={2.6}
                  />
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.optionCard,
                  pressed && styles.optionCardPressed,
                ]}
                onPress={() => startChoice("practice")}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>PRACTICE/SIMULASI</Text>
                  <Text style={styles.optionDescription}>
                    Simulasi adalah mode permainan tanpa batas yang bisa
                    dimainkan sesuka hati dan hasilnya hanya akan disimpan di
                    history.
                  </Text>
                </View>

                <View style={styles.chevronWrap}>
                  <ChevronRight
                    color={Color.colorOrangered}
                    size={24}
                    strokeWidth={2.6}
                  />
                </View>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              onPress={() => router.back()}
            >
              <ArrowLeft color={Color.colorWhite} size={22} strokeWidth={2.4} />
              <Text style={styles.backButtonText}>Kembali</Text>
            </Pressable>
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
    flex: 1,
  },
  heroSection: {
    minHeight: 230,
    backgroundColor: Gradient.primary[0],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroContent: {
    zIndex: 1,
    gap: 8,
  },
  heroTitle: {
    color: Color.colorWhite,
    fontSize: 52,
    lineHeight: 48,
    fontFamily: FontFamily.interExtraBold,
    letterSpacing: -1,
  },
  bodySection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.8,
    color: "#9b8b87",
    fontFamily: FontFamily.interSemiBold,
    marginBottom: 10,
  },
  cardList: {
    gap: 12,
    marginBottom: 90,
  },
  optionCard: {
    backgroundColor: Color.colorWhite,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 24,
    paddingVertical: 28,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: Shadow.medium,
    minHeight: 146,
  },
  optionCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  optionContent: {
    flex: 1,
    paddingRight: 18,
  },
  optionTitle: {
    color: "#694b47",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: FontFamily.interBold,
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  optionDescription: {
    color: "#c1b9b8",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.interMedium,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    height: 58,
    borderRadius: 14,
    backgroundColor: Gradient.cta[0],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: Shadow.medium,
    marginTop: "auto",
  },
  backButtonPressed: {
    opacity: 0.92,
  },
  backButtonText: {
    color: Color.colorWhite,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FontFamily.interSemiBold,
  },
});
