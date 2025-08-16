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
export declare class RateLimiter {
    private config;
    private requestsThisMinute;
    private requestsThisHour;
    private minuteResetTime;
    private hourResetTime;
    constructor(config: RateLimitConfig);
    isAllowed(): boolean;
    getStatus(): RateLimitStatus;
    getRemainingRequests(): {
        perMinute: number;
        perHour: number;
    };
    getTimeUntilReset(): {
        minutes: number;
        hours: number;
    };
    updateConfig(newConfig: Partial<RateLimitConfig>): void;
    reset(): void;
    private updateCounters;
    private resetCounters;
}
//# sourceMappingURL=rate-limiter.d.ts.map