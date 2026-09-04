#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

check_command() {
  local name="$1"
  local command_name="$2"
  local install_hint="$3"

  if command -v "$command_name" >/dev/null 2>&1; then
    echo "OK    $name: $($command_name --version 2>&1 | head -n 1)"
  else
    echo "ERROR $name belum terpasang."
    echo "      $install_hint"
    FAILED=1
  fi
}

echo "Pemeriksaan environment Android build"
echo "Project: $ROOT_DIR"
echo ""

check_command "Node.js" "node" "Install Node.js 18 atau lebih baru."
check_command "npm" "npm" "Install npm bersama Node.js."
check_command "Java" "java" "Install JDK 17 atau gunakan Android Studio."

if [ -d "$ROOT_DIR/node_modules" ]; then
  echo "OK    Dependencies: node_modules ada."
else
  echo "ERROR Dependencies belum diinstall."
  echo "      Jalankan: npm install"
  FAILED=1
fi

if [ -x "$ROOT_DIR/android/gradlew" ]; then
  echo "OK    Gradle wrapper: android/gradlew bisa dijalankan."
else
  echo "ERROR Gradle wrapper belum tersedia."
  echo "      Jalankan: npm run prebuild:android"
  FAILED=1
fi

if [ -n "${ANDROID_HOME:-}" ] || [ -n "${ANDROID_SDK_ROOT:-}" ]; then
  echo "OK    Android SDK env terdeteksi."
elif [ -d "$HOME/Android/Sdk" ]; then
  echo "OK    Android SDK ditemukan di $HOME/Android/Sdk."
else
  echo "ERROR Android SDK tidak ditemukan."
  echo "      Install Android Studio dan Android SDK."
  FAILED=1
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "Environment siap untuk build APK."
else
  echo "Ada yang perlu diperbaiki sebelum build."
  exit 1
fi
