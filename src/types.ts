/**
 * TypeScript types for thehub.io API and data structures
 */

export const COUNTRY_CODES = ['FI', 'SE', 'DK', 'NO', 'IS', 'EU', 'REMOTE'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

/**
 * Mapping of job position type IDs to human-readable labels
 */
export const JOB_POSITION_TYPE_MAP: Record<string, string> = {
    '5b8e46b3853f039706b6ea70': 'Full-time',
    '5b8e46b3853f039706b6ea71': 'Part-time',
    '5b8e46b3853f039706b6ea72': 'Student',
    '5b8e46b3853f039706b6ea73': 'Internship',
    '5b8e46b3853f039706b6ea74': 'Cofounder',
    '5b8e46b3853f039706b6ea75': 'Freelance',
    '62e28180d8cca695ee60c98e': 'Advisory board',
};

/**
 * Translate job position type IDs to human-readable labels
 */
export function translateJobPositionTypes(ids: string[]): string[] {
    return ids.map((id) => JOB_POSITION_TYPE_MAP[id] || id);
}

/**
 * Job listing from the API (basic info)
 */
export interface JobListingBasic {
    id: string;
    key: string;
    title: string;
    location: {
        country: string;
        locality: string;
        address: string;
    };
    isRemote: boolean;
    jobPositionTypes: string[];
    isFeatured: boolean;
    views: {
        week: number;
        total: number;
    };
    company: {
        id: string;
        key: string;
        name: string;
        website: string;
        numberOfEmployees: string;
        founded: string;
        logoImage?: {
            path: string;
        };
    };
    saved: boolean;
}

/**
 * Full job details from __NUXT__ SSR data
 */
export interface JobFull {
    id: string;
    key: string;
    title: string;
    description: string;
    descriptionLength?: number;
    salary: string;
    salaryRange?: {
        min: number;
        max: number;
    };
    equity: string;
    status: string;
    jobRole: string;
    jobPositionTypes: string[];
    countryCode: string;
    location: {
        country: string;
        locality: string;
        address: string;
    };
    isRemote: boolean;
    isFeatured: boolean;
    scraped?: boolean;
    link?: string;
    expirationDate?: string;
    createdAt: string;
    approvedAt?: string;
    publishedAt: string;
    views: {
        week: number;
        total: number;
    };
    socialImageUrl?: string;
    company: CompanyFull;
}

/**
 * Full company details from __NUXT__ SSR data
 */
export interface CompanyFull {
    id: string;
    key: string;
    name: string;
    website: string;
    numberOfEmployees: string;
    founded: string;
    video?: string;
    whatWeDo?: string;
    perks?: string[];
    logoImage?: {
        path: string;
        filetype?: string;
        size?: number;
    };
    galleryImages?: { path: string }[];
}

/**
 * API response for job listings
 */
export interface JobsApiResponse {
    jobs: {
        total: number;
        limit: number;
        page: number;
        pages: number;
        suggestions?: {
            jobPositionTypes: Record<string, number>;
            jobRoles: Record<string, number>;
            remote: number;
            paid: number;
        };
        docs: JobListingBasic[];
    };
    featuredJobs: {
        total: number;
        docs: JobListingBasic[];
    };
}

/**
 * __NUXT__ state structure
 */
export interface NuxtState {
    layout: string;
    data: unknown[];
    state: {
        jobs: {
            job: JobFull;
        };
    };
}

/**
 * Actor input configuration
 */
export interface Input {
    jobUrl?: string;
    regions?: CountryCode[];
    maxRequestsPerCrawl?: number;
}

/**
 * Output data structure pushed to dataset
 * Inferred from Zod schema - single source of truth
 */
export type { JobOutputValidated as JobOutput } from './schemas.js';
