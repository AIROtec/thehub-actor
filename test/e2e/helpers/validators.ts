import { type JobOutput, validateJobOutputSchema } from '../../helpers/schema-validator.js';

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

    // Validate each item against schema
    items.forEach((item, index) => {
        // Skip error items but count them
        if (item && typeof item === 'object' && 'error' in item) {
            errors.push(`Item ${index} is an error item: ${(item as Record<string, unknown>).error}`);
            return;
        }

        const schemaResult = validateJobOutputSchema(item);
        if (!schemaResult.isValid) {
            errors.push(`Item ${index} failed schema validation: ${schemaResult.errors.join(', ')}`);
        }

        // Type-safe checks after schema validation
        const jobData = item as Partial<JobOutput>;
        const itemId = jobData.id || `index-${index}`;

        // Check required fields are populated
        if (!jobData.title || jobData.title.trim() === '') {
            errors.push(`Item ${itemId}: title is empty or missing`);
        }

        if (!jobData.url || jobData.url.trim() === '') {
            errors.push(`Item ${itemId}: url is empty or missing`);
        }

        if (!jobData.description || jobData.description.trim() === '') {
            errors.push(`Item ${itemId}: description is empty or missing`);
        }

        // Validate URL format
        if (jobData.url && !isValidUrl(jobData.url)) {
            errors.push(`Item ${itemId}: url is not a valid URL format: ${jobData.url}`);
        }

        // Validate date format (ISO 8601)
        if (jobData.scrapedAt && !isValidISODate(jobData.scrapedAt)) {
            errors.push(`Item ${itemId}: scrapedAt is not in valid ISO 8601 format: ${jobData.scrapedAt}`);
        }

        if (jobData.createdAt && !isValidISODate(jobData.createdAt)) {
            errors.push(`Item ${itemId}: createdAt is not in valid ISO 8601 format: ${jobData.createdAt}`);
        }

        if (jobData.publishedAt && !isValidISODate(jobData.publishedAt)) {
            errors.push(`Item ${itemId}: publishedAt is not in valid ISO 8601 format: ${jobData.publishedAt}`);
        }

        // Validate company
        if (!jobData.company) {
            errors.push(`Item ${itemId}: company object is missing`);
        } else if (!jobData.company.name || jobData.company.name.trim() === '') {
            errors.push(`Item ${itemId}: company.name is empty or missing`);
        }

        // Validate location
        if (!jobData.location) {
            errors.push(`Item ${itemId}: location object is missing`);
        } else if (!jobData.location.country || jobData.location.country.trim() === '') {
            errors.push(`Item ${itemId}: location.country is empty or missing`);
        }

        // Validate isRemote is boolean
        if (typeof jobData.isRemote !== 'boolean') {
            errors.push(`Item ${itemId}: isRemote is not a boolean`);
        }

        // Validate jobPositionTypes is array
        if (!Array.isArray(jobData.jobPositionTypes)) {
            errors.push(`Item ${itemId}: jobPositionTypes is not an array`);
        }

        // Validate views
        if (!jobData.views) {
            errors.push(`Item ${itemId}: views object is missing`);
        } else {
            if (typeof jobData.views.week !== 'number') {
                errors.push(`Item ${itemId}: views.week is not a number`);
            }
            if (typeof jobData.views.total !== 'number') {
                errors.push(`Item ${itemId}: views.total is not a number`);
            }
        }

        // Validate salaryRange if present
        if (jobData.salaryRange) {
            if (typeof jobData.salaryRange.min !== 'number' || typeof jobData.salaryRange.max !== 'number') {
                errors.push(`Item ${itemId}: salaryRange has invalid min/max types`);
            }
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
 * Validates a URL string format
 */
function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validates ISO 8601 date format (YYYY-MM-DD or full ISO string)
 */
function isValidISODate(dateString: string): boolean {
    // Check if it's a valid date string
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    // For strict ISO format validation, check if it matches the pattern
    // YYYY-MM-DD or full ISO 8601 with time
    const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoPattern.test(dateString);
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
