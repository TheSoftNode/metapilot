/**
 * Performance Monitoring System
 */
import { Logger } from 'winston';
export interface PerformanceMetrics {
    totalAnalyses: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    averageProcessingTime: number;
    peakProcessingTime: number;
    analysesByType: Record<string, number>;
    processingTimesByType: Record<string, number[]>;
}
export declare class PerformanceMonitor {
    private logger;
    private metrics;
    private processingTimes;
    private maxMetricsHistory;
    constructor(logger: Logger);
    recordAnalysis(type: string, processingTime: number, success: boolean): void;
    getMetrics(): PerformanceMetrics;
    getTypeMetrics(type: string): any;
    getSuccessRate(): number;
    getPerformanceReport(): string;
    reset(): void;
    private checkPerformanceThresholds;
    private calculateMedian;
}
//# sourceMappingURL=performance.d.ts.map