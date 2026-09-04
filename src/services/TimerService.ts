/**
 * Timer Service
 * Mengelola countdown timer agar screen tidak menyimpan detail setInterval.
 */

type TickHandler = (remainingSeconds: number) => void;
type CompleteHandler = () => void;

class TimerService {
  private interval: ReturnType<typeof setInterval> | null = null;
  private remainingSeconds = 0;

  startCountdown(
    seconds: number,
    onTick: TickHandler,
    onComplete?: CompleteHandler
  ): void {
    this.stop();
    this.remainingSeconds = Math.max(0, seconds);
    onTick(this.remainingSeconds);

    if (this.remainingSeconds === 0) {
      onComplete?.();
      return;
    }

    this.interval = setInterval(() => {
      this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
      onTick(this.remainingSeconds);

      if (this.remainingSeconds === 0) {
        this.stop();
        onComplete?.();
      }
    }, 1000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset(seconds: number, onTick: TickHandler): void {
    this.stop();
    this.remainingSeconds = Math.max(0, seconds);
    onTick(this.remainingSeconds);
  }

  getTimeSpent(timeLimit: number, remainingSeconds: number): number {
    return Math.max(0, timeLimit - remainingSeconds);
  }

  formatSeconds(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatDuration(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}m ${secs}s`;
  }
}

export default new TimerService();
