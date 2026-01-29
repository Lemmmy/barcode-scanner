// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export class CooldownManager {
  private lastScanned = new Map<string, number>();

  canScan(code: string, cooldownMs: number): boolean {
    const now = Date.now();
    const lastTime = this.lastScanned.get(code);

    if (lastTime && now - lastTime < cooldownMs) {
      return false;
    }

    this.lastScanned.set(code, now);
    return true;
  }

  clear(): void {
    this.lastScanned.clear();
  }
}
