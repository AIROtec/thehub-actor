/**
 * Schema validator for thehub.io job data
 * Uses Zod schema from src/schemas.ts as single source of truth
 */

import { JobOutputSchema } from '../../src/schemas.js';

// Re-export the inferred type from Zod schema
export type { JobOutputValidated as JobOutput } from '../../src/schemas.js';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validates the structure and content of scraped job data
 */
export function validateJobOutputSchema(data: unknown): ValidationResult {
    const result = JobOutputSchema.safeParse(data);

    if (result.success) {
        return { isValid: true, errors: [] };
    }

    const errors = result.error.issues.map((issue) => {
        const path = issue.path.map(String).join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
    });

    return { isValid: false, errors };
}

/**
 * Validates that test case has expected values (non-empty, meaningful data)
 * This is for E2E tests to verify scraped data quality
 */
export function validateTestCaseHasValues(data: {
    title?: string;
    description?: string;
    url?: string;
    company?: { name?: string };
}): ValidationResult {
    const errors: string[] = [];

    if (!data.title || data.title.length < 3) {
        errors.push('title should be at least 3 characters long');
    }

    if (!data.description || data.description.length < 10) {
        errors.push('description should be at least 10 characters long');
    }

    if (data.url && !data.url.startsWith('https://thehub.io/jobs/')) {
        errors.push('url should be a valid thehub.io job URL');
    }

    if (!data.company?.name || data.company.name.length < 2) {
        errors.push('company.name should be at least 2 characters long');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
