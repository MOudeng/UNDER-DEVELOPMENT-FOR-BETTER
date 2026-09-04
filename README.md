# Otak-Atik Merah Putih

Frontend `blockdesignapp-main` dengan fitur dan logika permainan dari
`Pakanom`.

## Menjalankan Aplikasi

```bash
npm install
npm start
```

Untuk membuka Android:

```bash
npm run android
```

Untuk membuat file APK standalone tanpa Expo Go:

```bash
npm run build:apk
```

Hasil build:

```text
BlockDesignApp-arm64-release.apk
```

## Fitur

- Login dan registrasi lokal melalui email, kode unik, atau barcode
- Profil pengguna yang tersimpan dengan `AsyncStorage`
- Mode test dan practice dengan 8 level Block Design
- Timer, perhitungan skor, riwayat permainan, dan session tracking
- Statistik pada halaman home
- Analisa kognitif lokal dan AI fallback

## Konfigurasi AI

Salin nilai yang diperlukan dari `.env.example` ke `.env`. Tanpa API key,
halaman analisa tetap bekerja menggunakan analisa lokal.

```bash
cp .env.example .env
```

Isi minimal salah satu API key asli:

```env
EXPO_PUBLIC_OPENROUTER_API_KEY=...
EXPO_PUBLIC_AI_MODELS=openai/gpt-oss-120b:free,qwen/qwen3-coder:free,openrouter/free
```

atau:

```env
EXPO_PUBLIC_OPENAI_API_KEY=...
```

Lalu cek koneksi AI:

```bash
npm run check:ai
```

Jika `npm run check:ai` belum ready, APK akan tetap bisa dibuat, tetapi halaman
analisa akan menampilkan `Fallback Lokal`.

Untuk OpenRouter, aplikasi akan menjalankan beberapa model dari
`EXPO_PUBLIC_AI_MODELS` secara paralel, menilai kelengkapan jawaban, lalu
menampilkan analisis yang paling sesuai. `EXPO_PUBLIC_AI_MODEL` masih didukung
untuk konfigurasi lama, tetapi daftar beberapa model sebaiknya ditulis di
`EXPO_PUBLIC_AI_MODELS`.

## Pemeriksaan

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
```
