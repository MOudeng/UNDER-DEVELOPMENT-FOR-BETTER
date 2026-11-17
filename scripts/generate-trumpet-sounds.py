#!/usr/bin/env python3
"""Generates the trumpet completion sounds into assets/sounds/. Stdlib only.

Run from anywhere: python scripts/generate-trumpet-sounds.py
"""

import array
import math
import random
import wave
from pathlib import Path

SAMPLE_RATE = 22050
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "sounds"

# Android's audio output takes a moment to wake on the first play; without this
# lead-in it swallows the first note (the old 80 ms beep vanished entirely).
LEAD_IN_SECONDS = 0.2

SPEED = 1.25

G4, C5, E5, G5, C6 = 392.00, 523.25, 659.25, 783.99, 1046.50

# (frequency, seconds) melody of a classic bugle-style fanfare. Bugles only play
# the natural notes of one chord, which is what makes it sound "classic".
PATTERN_MELODY = [(G4, 0.11), (C5, 0.11), (E5, 0.42)]
SESSION_MELODY = [
    (G4, 0.16),
    (C5, 0.16),
    (E5, 0.16),
    (G5, 0.38),
    (E5, 0.14),
    (G5, 0.14),
    (C6, 1.05),
]


def trumpet_note(frequency: float, seconds: float, rng: random.Random) -> list[float]:
    total = int(seconds * SAMPLE_RATE)
    samples = [0.0] * total
    release = min(0.07, seconds * 0.35)
    is_long = seconds > 0.3
    phases = [rng.random() * math.tau for _ in range(16)]
    phase = 0.0

    for n in range(total):
        t = n / SAMPLE_RATE
        remaining = seconds - t

        # The player's lip attack: fast swell, small overshoot, then sustain.
        attack = min(1.0, t / 0.022)
        overshoot = 1.0 + 0.3 * math.exp(-max(0.0, t - 0.022) / 0.05)
        envelope = attack * overshoot * min(1.0, remaining / release) / 1.3

        # Brass notes start slightly flat, and only long notes get vibrato.
        scoop = 1.0 - 0.025 * math.exp(-t / 0.025)
        vibrato_depth = 0.006 * min(1.0, max(0.0, t - 0.22) / 0.2) if is_long else 0.0
        vibrato = 1.0 + vibrato_depth * math.sin(math.tau * 5.6 * t)
        phase += math.tau * frequency * scoop * vibrato / SAMPLE_RATE

        # Brass gets brighter as it gets louder, so the rolloff follows the envelope.
        rolloff = 2.1 - 1.15 * min(1.0, envelope)
        value = 0.0
        for harmonic in range(1, 17):
            harmonic_frequency = frequency * harmonic
            if harmonic_frequency >= SAMPLE_RATE / 2:
                break
            # The trumpet bell emphasises the range around 1.3 kHz.
            bell = 1.0 + 1.4 * math.exp(-(((harmonic_frequency - 1300) / 900) ** 2))
            value += (
                bell
                * math.sin(harmonic * phase + phases[harmonic - 1])
                / harmonic**rolloff
            )
        samples[n] = value * envelope
    return samples


def render(melody: list[tuple[float, float]], seed: int) -> list[float]:
    rng = random.Random(seed)
    lead_in = int(LEAD_IN_SECONDS * SAMPLE_RATE)
    tail = int(0.3 * SAMPLE_RATE)
    gap = int(0.012 * SAMPLE_RATE)  # tongue articulation between notes
    length = lead_in + tail + sum(int(s * SAMPLE_RATE) + gap for _, s in melody)
    dry = [0.0] * length

    position = lead_in
    for frequency, seconds in melody:
        note = trumpet_note(frequency, seconds, rng)
        for i, value in enumerate(note):
            dry[position + i] += value
        position += len(note) + gap

    # A short room reverb, so the horn does not sound like it is in a box.
    wet = dry[:]
    for delay_seconds, gain in ((0.031, 0.22), (0.047, 0.18), (0.071, 0.13), (0.113, 0.08)):
        delay = int(delay_seconds * SAMPLE_RATE)
        for i in range(delay, length):
            wet[i] += dry[i - delay] * gain

    peak = max(abs(value) for value in wet)
    return [value / peak * 0.9 for value in wet]


def write_wav(path: Path, samples: list[float]) -> None:
    pcm = array.array("h", (int(value * 32767) for value in samples))
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def detected_pitch(samples: list[float], start_seconds: float, seconds: float) -> float:
    """Autocorrelation pitch of a slice, used to check the notes came out in tune."""
    start = int(start_seconds * SAMPLE_RATE)
    chunk = samples[start : start + int(seconds * SAMPLE_RATE)]
    scores = {
        lag: sum(chunk[i] * chunk[i + lag] for i in range(len(chunk) - lag)) / (len(chunk) - lag)
        for lag in range(SAMPLE_RATE // 1400, SAMPLE_RATE // 300)
    }
    best_score = max(scores.values())
    # Whole multiples of the period score just as high, so take the shortest peak.
    for lag, score in scores.items():
        if score >= best_score * 0.9 and score >= scores.get(lag + 1, -math.inf):
            return SAMPLE_RATE / lag
    raise AssertionError("no pitch found")


def check(samples: list[float], melody: list[tuple[float, float]]) -> None:
    lead_in = int(LEAD_IN_SECONDS * SAMPLE_RATE)
    assert all(value == 0 for value in samples[: lead_in - 1]), "lead-in must be silent"
    assert 0.85 < max(abs(value) for value in samples) <= 0.9001, "unexpected peak level"
    position = LEAD_IN_SECONDS
    for frequency, seconds in melody:
        slice_seconds = min(0.08, seconds * 0.6)
        pitch = detected_pitch(samples, position + seconds * 0.3, slice_seconds)
        # Short notes read coarsely at this sample rate, hence the 4% tolerance.
        assert abs(pitch - frequency) / frequency < 0.04, f"{frequency} Hz came out as {pitch:.0f} Hz"
        position += seconds + 0.012


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, melody, seed in (
        ("trumpet-pattern.wav", PATTERN_MELODY, 11),
        ("trumpet-session.wav", SESSION_MELODY, 23),
    ):
        # Shorter notes, same pitch: the tempo is SPEED times faster.
        melody = [(frequency, seconds / SPEED) for frequency, seconds in melody]
        samples = render(melody, seed)
        check(samples, melody)
        write_wav(OUTPUT_DIR / name, samples)
        print(f"{name}: {len(samples) / SAMPLE_RATE:.2f}s, {len(samples) * 2 // 1024} KB, notes in tune")


if __name__ == "__main__":
    main()
