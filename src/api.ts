/**
 * API utilities for fetching thehub.io job listings
 */

import { log } from 'crawlee';

import type { CountryCode, JobListingBasic, JobsApiResponse } from './types.js';

const BASE_URL = 'https://thehub.io/api/v2';
const PAGE_SIZE = 15; // Fixed by TheHub API

/**
 * Fetch job listings for a specific country and page
 * Note: REMOTE uses isRemote=true instead of countryCode
 */
export async function fetchJobsPage(countryCode: CountryCode, page: number): Promise<JobsApiResponse> {
    const url = new URL(`${BASE_URL}/jobsandfeatured`);

    if (countryCode === 'REMOTE') {
        url.searchParams.set('isRemote', 'true');
    } else {
        url.searchParams.set('countryCode', countryCode);
    }

    url.searchParams.set('page', page.toString());
    url.searchParams.set('sorting', 'mostPopular');

    log.debug(`Fetching jobs: ${url.toString()}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as JobsApiResponse;
}

/**
 * Fetch all job listings for a specific country (handles pagination)
 * @param countryCode - Country code to fetch jobs for
 * @param limit - Optional limit on number of jobs to fetch (0 = unlimited)
 */
export async function fetchAllJobsForCountry(countryCode: CountryCode, limit = 0): Promise<JobListingBasic[]> {
    const allJobs: JobListingBasic[] = [];
    let page = 1;
    let totalPages = 1;

    log.info(`Fetching jobs for country: ${countryCode}${limit > 0 ? ` (limit: ${limit})` : ''}`);

    while (page <= totalPages) {
        const response = await fetchJobsPage(countryCode, page);

        // Add regular jobs
        allJobs.push(...response.jobs.docs);

        // Add featured jobs (only on first page to avoid duplicates)
        if (page === 1 && response.featuredJobs?.docs) {
            allJobs.push(...response.featuredJobs.docs);
        }

        totalPages = response.jobs.pages;

        log.info(`Fetched page ${page}/${totalPages} for ${countryCode}: ${response.jobs.docs.length} jobs`);

        // Stop early if we have enough jobs
        if (limit > 0 && allJobs.length >= limit) {
            log.info(`Reached limit of ${limit} jobs, stopping pagination`);
            break;
        }

        page++;
    }

    log.info(`Fetched ${allJobs.length} total jobs for ${countryCode}`);

    return allJobs;
}

/**
 * Fetch all jobs for multiple countries
 * @param countryCodes - Array of country codes to fetch jobs for
 * @param limit - Optional limit on total number of jobs to fetch (0 = unlimited)
 */
export async function fetchAllJobs(countryCodes: CountryCode[], limit = 0): Promise<JobListingBasic[]> {
    const allJobs: JobListingBasic[] = [];
    const seenJobIds = new Set<string>();

    for (const countryCode of countryCodes) {
        // Calculate remaining jobs needed
        const remaining = limit > 0 ? limit - allJobs.length : 0;

        // Stop if we've reached the limit
        if (limit > 0 && allJobs.length >= limit) {
            break;
        }

        const jobs = await fetchAllJobsForCountry(countryCode, remaining);

        // Deduplicate jobs that might appear in multiple countries
        for (const job of jobs) {
            if (!seenJobIds.has(job.id)) {
                seenJobIds.add(job.id);
                allJobs.push(job);

                // Stop if we've reached the limit
                if (limit > 0 && allJobs.length >= limit) {
                    break;
                }
            }
        }
    }

    log.info(`Fetched ${allJobs.length} unique jobs across ${countryCodes.length} countries`);

    return allJobs;
}

/**
 * Build the image URL from a relative path
 */
export function buildImageUrl(path: string, width = 300, height = 300): string {
    return `https://thehub-io.imgix.net${path}?fit=crop&w=${width}&h=${height}&auto=format&q=60`;
}

/**
 * Get the page size (fixed at 15 by TheHub API)
 */
export function getPageSize(): number {
    return PAGE_SIZE;
}
