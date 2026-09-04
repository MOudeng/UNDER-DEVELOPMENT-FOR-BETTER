#!/bin/bash
set -euo pipefail

# Build a standalone Android APK without Expo Go.
# Output: BlockDesignApp-arm64-release.apk

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
APK_IN_BUILD="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
APK_IN_ROOT="$ROOT_DIR/BlockDesignApp-arm64-release.apk"

echo "Build APK Android standalone (arm64-v8a)"
echo "Project: $ROOT_DIR"
echo ""

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "ERROR: node_modules belum ada."
  echo "Jalankan dulu: npm install"
  exit 1
fi

if [ ! -d "$ANDROID_DIR" ]; then
  echo "1/4 Membuat project native Android..."
  (
    cd "$ROOT_DIR"
    npx expo prebuild --platform android --no-install
  )
else
  echo "1/4 Project native Android sudah tersedia."
fi

if [ ! -x "$ANDROID_DIR/gradlew" ]; then
  chmod +x "$ANDROID_DIR/gradlew"
fi

SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [ -z "$SDK_DIR" ] && [ -d "$HOME/Android/Sdk" ]; then
  SDK_DIR="$HOME/Android/Sdk"
fi

if [ -n "$SDK_DIR" ]; then
  printf 'sdk.dir=%s\n' "$SDK_DIR" > "$ANDROID_DIR/local.properties"
fi

echo "2/4 Memeriksa environment build..."
"$ROOT_DIR/scripts/check-android-build.sh"

echo ""
echo "3/4 Membuat APK release..."
rm -rf "$ANDROID_DIR/app/.cxx" "$ANDROID_DIR/app/build" "$ANDROID_DIR/build"
(
  cd "$ANDROID_DIR"
  NODE_ENV=production ./gradlew assembleRelease \
    -PreactNativeArchitectures=arm64-v8a \
    -Pandroid.enableMinifyInReleaseBuilds=true \
    -Pandroid.enableShrinkResourcesInReleaseBuilds=true
)

if [ ! -f "$APK_IN_BUILD" ]; then
  echo "ERROR: Build selesai, tetapi APK tidak ditemukan:"
  echo "$APK_IN_BUILD"
  exit 1
fi

echo "4/4 Menyalin APK ke root project..."
cp "$APK_IN_BUILD" "$APK_IN_ROOT"

APK_BYTES=$(stat -c%s "$APK_IN_ROOT")
APK_MB=$(awk "BEGIN { printf \"%.1f\", $APK_BYTES / 1024 / 1024 }")

echo ""
echo "Selesai."
echo "APK: $APK_IN_ROOT"
echo "Ukuran: ${APK_MB} MB"
echo ""
echo "Install ke HP dengan:"
echo "adb install -r \"$APK_IN_ROOT\""
