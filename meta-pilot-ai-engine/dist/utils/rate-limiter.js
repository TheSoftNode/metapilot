"use strict";
/**
 * Rate Limiting System for AI Engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor(config) {
        this.config = config;
        this.requestsThisMinute = 0;
        this.requestsThisHour = 0;
        this.minuteResetTime = 0;
        this.hourResetTime = 0;
        this.resetCounters();
    }
    isAllowed() {
        if (!this.config.enabled)
            return true;
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
    getStatus() {
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
    getRemainingRequests() {
        this.updateCounters();
        return {
            perMinute: Math.max(0, this.config.requestsPerMinute - this.requestsThisMinute),
            perHour: Math.max(0, this.config.requestsPerHour - this.requestsThisHour)
        };
    }
    getTimeUntilReset() {
        const now = Date.now();
        return {
            minutes: Math.max(0, this.minuteResetTime - now),
            hours: Math.max(0, this.hourResetTime - now)
        };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    reset() {
        this.resetCounters();
    }
    updateCounters() {
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
    resetCounters() {
        const now = Date.now();
        this.requestsThisMinute = 0;
        this.requestsThisHour = 0;
        this.minuteResetTime = now + (60 * 1000);
        this.hourResetTime = now + (60 * 60 * 1000);
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map