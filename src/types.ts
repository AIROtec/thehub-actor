/**
 * TypeScript types for TheHub.io API and data structures
 */

export const COUNTRY_CODES = ['FI', 'SE', 'DK', 'NO', 'IS', 'EU'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

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
    countries?: CountryCode[];
    maxRequestsPerCrawl?: number;
}

/**
 * Output data structure pushed to dataset
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
