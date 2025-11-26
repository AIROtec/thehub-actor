/**
 * Schema validator for thehub.io job data
 * Must match src/types.ts JobOutput interface
 */

export interface JobOutput {
    id: string;
    key: string;
    url: string;
    title: string;
    description: string;
    company: {
        id: string;
        key: string;
        name: string;
        website: string;
        numberOfEmployees: string;
        founded: string;
        whatWeDo?: string;
        logoUrl?: string;
    };
    location: {
        country: string;
        locality: string;
        address: string;
    };
    isRemote: boolean;
    salary: string;
    salaryRange?: {
        min: number;
        max: number;
    };
    equity: string;
    jobRole: string;
    jobPositionTypes: string[];
    views: {
        week: number;
        total: number;
    };
    link?: string;
    createdAt: string;
    publishedAt: string;
    expirationDate?: string;
    scrapedAt: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validates the structure and content of scraped job data
 */
export function validateJobOutputSchema(data: unknown): ValidationResult {
    const errors: string[] = [];

    // Type guard
    if (!data || typeof data !== 'object') {
        errors.push('data must be an object');
        return { isValid: false, errors };
    }

    const record = data as Record<string, unknown>;

    // Required string fields
    const requiredStringFields = [
        'id',
        'key',
        'url',
        'title',
        'description',
        'salary',
        'equity',
        'jobRole',
        'createdAt',
        'publishedAt',
        'scrapedAt',
    ];

    for (const field of requiredStringFields) {
        if (typeof record[field] !== 'string' || record[field] === '') {
            errors.push(`${field} is required and must be a non-empty string`);
        }
    }

    // Validate URL format
    if (typeof record.url === 'string' && record.url !== '') {
        try {
            const parsed = new URL(record.url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                errors.push('url must have http or https protocol');
            }
        } catch {
            errors.push('url must be a valid URL');
        }
    }

    // Validate isRemote is boolean
    if (typeof record.isRemote !== 'boolean') {
        errors.push('isRemote must be a boolean');
    }

    // Validate jobPositionTypes is array
    if (!Array.isArray(record.jobPositionTypes)) {
        errors.push('jobPositionTypes must be an array');
    }

    // Validate company object
    if (!record.company || typeof record.company !== 'object') {
        errors.push('company must be an object');
    } else {
        const company = record.company as Record<string, unknown>;
        const requiredCompanyFields = ['id', 'key', 'name', 'website', 'numberOfEmployees', 'founded'];
        for (const field of requiredCompanyFields) {
            if (typeof company[field] !== 'string') {
                errors.push(`company.${field} must be a string`);
            }
        }
    }

    // Validate location object
    if (!record.location || typeof record.location !== 'object') {
        errors.push('location must be an object');
    } else {
        const location = record.location as Record<string, unknown>;
        const requiredLocationFields = ['country', 'locality', 'address'];
        for (const field of requiredLocationFields) {
            if (typeof location[field] !== 'string') {
                errors.push(`location.${field} must be a string`);
            }
        }
    }

    // Validate views object
    if (!record.views || typeof record.views !== 'object') {
        errors.push('views must be an object');
    } else {
        const views = record.views as Record<string, unknown>;
        if (typeof views.week !== 'number') {
            errors.push('views.week must be a number');
        }
        if (typeof views.total !== 'number') {
            errors.push('views.total must be a number');
        }
    }

    // Validate salaryRange if present
    if (record.salaryRange !== undefined) {
        if (!record.salaryRange || typeof record.salaryRange !== 'object') {
            errors.push('salaryRange must be an object when present');
        } else {
            const salaryRange = record.salaryRange as Record<string, unknown>;
            if (typeof salaryRange.min !== 'number') {
                errors.push('salaryRange.min must be a number');
            }
            if (typeof salaryRange.max !== 'number') {
                errors.push('salaryRange.max must be a number');
            }
        }
    }

    // Validate date fields are ISO format
    const dateFields = ['createdAt', 'publishedAt', 'scrapedAt'];
    for (const field of dateFields) {
        const value = record[field];
        if (typeof value === 'string' && value !== '') {
            if (!isValidISODate(value)) {
                errors.push(`${field} must be a valid ISO date string`);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validates ISO 8601 date format
 */
function isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return false;
    }
    // Check ISO format pattern
    const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    return isoPattern.test(dateString);
}

/**
 * Validates that test case has expected values (non-empty, meaningful data)
 */
export function validateTestCaseHasValues(data: JobOutput): ValidationResult {
    const errors: string[] = [];

    // Check that critical fields have meaningful values
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
