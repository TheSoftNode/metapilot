/**
 * Rate Limiting System for AI Engine
 */

export interface RateLimitConfig {
  enabled: boolean;
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface RateLimitStatus {
  requestsThisMinute: number;
  requestsThisHour: number;
  resetTimeMinute: number;
  resetTimeHour: number;
  isAllowed: boolean;
}

export class RateLimiter {
  private requestsThisMinute = 0;
  private requestsThisHour = 0;
  private minuteResetTime = 0;
  private hourResetTime = 0;

  constructor(private config: RateLimitConfig) {
    this.resetCounters();
  }

  isAllowed(): boolean {
    if (!this.config.enabled) return true;

    this.updateCounters();

    // Check both per-minute and per-hour limits
    const minuteOk = this.requestsThisMinute < this.config.requestsPerMinute;
    const hourOk = this.requestsThisHour < this.config.requestsPerHour;

    if (minuteOk && hourOk) {
      this.requestsThisMinute++;
      this.requestsThisHour++;
      return true;
    }

    return false;
  }

  getStatus(): RateLimitStatus {
    this.updateCounters();

    return {
      requestsThisMinute: this.requestsThisMinute,
      requestsThisHour: this.requestsThisHour,
      resetTimeMinute: this.minuteResetTime,
      resetTimeHour: this.hourResetTime,
      isAllowed: this.requestsThisMinute < this.config.requestsPerMinute && 
                this.requestsThisHour < this.config.requestsPerHour
    };
  }

  getRemainingRequests(): { perMinute: number; perHour: number } {
    this.updateCounters();

    return {
      perMinute: Math.max(0, this.config.requestsPerMinute - this.requestsThisMinute),
      perHour: Math.max(0, this.config.requestsPerHour - this.requestsThisHour)
    };
  }

  getTimeUntilReset(): { minutes: number; hours: number } {
    const now = Date.now();
    
    return {
      minutes: Math.max(0, this.minuteResetTime - now),
      hours: Math.max(0, this.hourResetTime - now)
    };
  }

  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  reset(): void {
    this.resetCounters();
  }

  private updateCounters(): void {
    const now = Date.now();

    // Reset minute counter if needed
    if (now >= this.minuteResetTime) {
      this.requestsThisMinute = 0;
      this.minuteResetTime = now + (60 * 1000); // Next minute
    }

    // Reset hour counter if needed
    if (now >= this.hourResetTime) {
      this.requestsThisHour = 0;
      this.hourResetTime = now + (60 * 60 * 1000); // Next hour
    }
  }

  private resetCounters(): void {
    const now = Date.now();
    this.requestsThisMinute = 0;
    this.requestsThisHour = 0;
    this.minuteResetTime = now + (60 * 1000);
    this.hourResetTime = now + (60 * 60 * 1000);
  }
}