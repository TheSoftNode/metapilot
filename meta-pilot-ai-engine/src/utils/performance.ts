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

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    averageProcessingTime: 0,
    peakProcessingTime: 0,
    analysesByType: {},
    processingTimesByType: {}
  };

  private processingTimes: number[] = [];
  private maxMetricsHistory = 1000;

  constructor(private logger: Logger) {}

  recordAnalysis(type: string, processingTime: number, success: boolean): void {
    // Update overall metrics
    this.metrics.totalAnalyses++;
    
    if (success) {
      this.metrics.successfulAnalyses++;
    } else {
      this.metrics.failedAnalyses++;
    }

    // Record processing time
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.maxMetricsHistory) {
      this.processingTimes.shift();
    }

    // Update average processing time
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;

    // Update peak processing time
    if (processingTime > this.metrics.peakProcessingTime) {
      this.metrics.peakProcessingTime = processingTime;
    }

    // Update type-specific metrics
    this.metrics.analysesByType[type] = (this.metrics.analysesByType[type] || 0) + 1;
    
    if (!this.metrics.processingTimesByType[type]) {
      this.metrics.processingTimesByType[type] = [];
    }
    this.metrics.processingTimesByType[type].push(processingTime);
    
    // Keep type-specific history limited
    if (this.metrics.processingTimesByType[type].length > 100) {
      this.metrics.processingTimesByType[type].shift();
    }

    // Log performance warnings
    this.checkPerformanceThresholds(type, processingTime);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getTypeMetrics(type: string): any {
    const times = this.metrics.processingTimesByType[type] || [];
    
    if (times.length === 0) {
      return null;
    }

    return {
      totalAnalyses: this.metrics.analysesByType[type] || 0,
      averageProcessingTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minProcessingTime: Math.min(...times),
      maxProcessingTime: Math.max(...times),
      medianProcessingTime: this.calculateMedian(times)
    };
  }

  getSuccessRate(): number {
    if (this.metrics.totalAnalyses === 0) return 0;
    return (this.metrics.successfulAnalyses / this.metrics.totalAnalyses) * 100;
  }

  getPerformanceReport(): string {
    const report = [
      '=== AI Engine Performance Report ===',
      `Total Analyses: ${this.metrics.totalAnalyses}`,
      `Success Rate: ${this.getSuccessRate().toFixed(2)}%`,
      `Average Processing Time: ${this.metrics.averageProcessingTime.toFixed(2)}ms`,
      `Peak Processing Time: ${this.metrics.peakProcessingTime}ms`,
      '',
      'Analysis by Type:'
    ];

    Object.entries(this.metrics.analysesByType).forEach(([type, count]) => {
      const typeMetrics = this.getTypeMetrics(type);
      report.push(`  ${type}: ${count} analyses, avg ${typeMetrics?.averageProcessingTime.toFixed(2)}ms`);
    });

    return report.join('\n');
  }

  reset(): void {
    this.metrics = {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      averageProcessingTime: 0,
      peakProcessingTime: 0,
      analysesByType: {},
      processingTimesByType: {}
    };
    this.processingTimes = [];
  }

  private checkPerformanceThresholds(type: string, processingTime: number): void {
    // Warn about slow analyses
    if (processingTime > 10000) { // 10 seconds
      this.logger.warn(`Slow analysis detected: ${type} took ${processingTime}ms`);
    }

    // Warn about consistently slow analysis types
    const typeMetrics = this.getTypeMetrics(type);
    if (typeMetrics && typeMetrics.averageProcessingTime > 5000) { // 5 seconds average
      this.logger.warn(`Analysis type ${type} consistently slow: avg ${typeMetrics.averageProcessingTime.toFixed(2)}ms`);
    }

    // Warn about low success rates
    const successRate = this.getSuccessRate();
    if (this.metrics.totalAnalyses > 10 && successRate < 80) {
      this.logger.warn(`Low success rate detected: ${successRate.toFixed(2)}%`);
    }
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0 
      ? sorted[mid] 
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}