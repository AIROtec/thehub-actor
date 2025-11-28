import { validateJobOutputSchema } from '../../helpers/schema-validator.js';

export interface DataQualityResult {
    isValid: boolean;
    errors: string[];
}

export interface PerformanceMetrics {
    durationMillis: number;
    memoryUsageBytes: number;
    requestsFinished: number;
    requestsFailed: number;
}

export interface PerformanceValidationResult {
    isValid: boolean;
    errors: string[];
    metrics: PerformanceMetrics;
}

/**
 * Validates data quality for all items in the dataset
 * Uses Zod schema from src/schemas.ts as single source of truth
 */
export function validateDataQuality(items: unknown[]): DataQualityResult {
    const errors: string[] = [];

    if (!Array.isArray(items)) {
        errors.push('items must be an array');
        return { isValid: false, errors };
    }

    if (items.length === 0) {
        errors.push('dataset is empty - no items were scraped');
        return { isValid: false, errors };
    }

    console.log(`Validating ${items.length} items...`);

    // Validate each item against Zod schema
    items.forEach((item, index) => {
        // Skip error items but count them
        if (item && typeof item === 'object' && 'error' in item) {
            errors.push(`Item ${index} is an error item: ${(item as Record<string, unknown>).error}`);
            return;
        }

        const schemaResult = validateJobOutputSchema(item);
        if (!schemaResult.isValid) {
            const itemId = (item as Record<string, unknown>)?.id || `index-${index}`;
            errors.push(`Item ${itemId} failed schema validation: ${schemaResult.errors.join(', ')}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validates performance metrics are within acceptable ranges
 */
export function validatePerformance(
    metrics: PerformanceMetrics,
    options: {
        maxDurationMillis?: number;
        maxMemoryMB?: number;
        expectedRequestsMin?: number;
        expectedRequestsMax?: number;
        maxFailedRequests?: number;
    } = {},
): PerformanceValidationResult {
    const errors: string[] = [];

    const {
        maxDurationMillis = 5 * 60 * 1000, // 5 minutes
        maxMemoryMB = 1024, // 1 GB
        expectedRequestsMin = 1,
        expectedRequestsMax = 100,
        maxFailedRequests = 0,
    } = options;

    console.log('Performance metrics:', metrics);

    // Check duration
    if (metrics.durationMillis > maxDurationMillis) {
        errors.push(
            `Actor run took too long: ${(metrics.durationMillis / 1000).toFixed(0)}s (max: ${(maxDurationMillis / 1000).toFixed(0)}s)`,
        );
    }

    // Check memory usage
    const memoryMB = metrics.memoryUsageBytes / (1024 * 1024);
    if (memoryMB > maxMemoryMB) {
        errors.push(`Memory usage too high: ${memoryMB.toFixed(0)}MB (max: ${maxMemoryMB}MB)`);
    }

    // Check request counts
    if (metrics.requestsFinished < expectedRequestsMin) {
        errors.push(`Too few requests completed: ${metrics.requestsFinished} (min: ${expectedRequestsMin})`);
    }

    if (metrics.requestsFinished > expectedRequestsMax) {
        errors.push(`Too many requests completed: ${metrics.requestsFinished} (max: ${expectedRequestsMax})`);
    }

    // Check failed requests
    if (metrics.requestsFailed > maxFailedRequests) {
        errors.push(`Too many failed requests: ${metrics.requestsFailed} (max: ${maxFailedRequests})`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        metrics,
    };
}

/**
 * Generate a summary report of validation results
 */
export function generateValidationReport(
    dataQuality: DataQualityResult,
    performance: PerformanceValidationResult,
    itemCount: number,
): string {
    const lines: string[] = [];

    lines.push('=== E2E Test Validation Report ===\n');

    lines.push(`Items Scraped: ${itemCount}`);
    lines.push(`Duration: ${(performance.metrics.durationMillis / 1000).toFixed(1)}s`);
    lines.push(`Memory: ${(performance.metrics.memoryUsageBytes / (1024 * 1024)).toFixed(1)}MB`);
    lines.push(
        `Requests: ${performance.metrics.requestsFinished} finished, ${performance.metrics.requestsFailed} failed\n`,
    );

    // Data Quality
    lines.push('Data Quality:');
    if (dataQuality.isValid) {
        lines.push('  ✓ All items passed validation');
    } else {
        lines.push(`  ✗ ${dataQuality.errors.length} errors found:`);
        dataQuality.errors.slice(0, 10).forEach((err) => lines.push(`    - ${err}`));
        if (dataQuality.errors.length > 10) {
            lines.push(`    ... and ${dataQuality.errors.length - 10} more errors`);
        }
    }

    lines.push('');

    // Performance
    lines.push('Performance:');
    if (performance.isValid) {
        lines.push('  ✓ All metrics within acceptable ranges');
    } else {
        lines.push(`  ✗ ${performance.errors.length} issues found:`);
        performance.errors.forEach((err) => lines.push(`    - ${err}`));
    }

    lines.push('\n=== End Report ===');

    return lines.join('\n');
}
