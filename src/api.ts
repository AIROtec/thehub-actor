/**
 * API utilities for fetching thehub.io job listings
 */

import { log } from 'crawlee';

import type { JobListingBasic, JobsApiResponse, RegionCode } from './types.js';

const BASE_URL = 'https://thehub.io/api/v2';
const PAGE_SIZE = 15; // Fixed by TheHub API

/**
 * Fetch job listings for a specific region and page
 * Note: REMOTE uses isRemote=true instead of countryCode
 */
export async function fetchJobsPage(region: RegionCode, page: number): Promise<JobsApiResponse> {
    const url = new URL(`${BASE_URL}/jobsandfeatured`);

    if (region === 'REMOTE') {
        url.searchParams.set('isRemote', 'true');
    } else {
        url.searchParams.set('countryCode', region);
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
 * Fetch all job listings for a specific region (handles pagination)
 * Uses parallel fetching for remaining pages after getting page 1
 * @param region - Region code to fetch jobs for
 * @param limit - Optional limit on number of jobs to fetch (0 = unlimited)
 */
export async function fetchAllJobsForRegion(region: RegionCode, limit = 0): Promise<JobListingBasic[]> {
    const allJobs: JobListingBasic[] = [];

    log.info(`Fetching jobs for region: ${region}${limit > 0 ? ` (limit: ${limit})` : ''}`);

    // Fetch first page to get total pages count
    const firstResponse = await fetchJobsPage(region, 1);
    const totalPages = firstResponse.jobs.pages;

    // Add jobs from first page
    allJobs.push(...firstResponse.jobs.docs);
    if (firstResponse.featuredJobs?.docs) {
        allJobs.push(...firstResponse.featuredJobs.docs);
    }

    const featuredCount = firstResponse.featuredJobs?.docs?.length ?? 0;
    const regularCount = firstResponse.jobs.docs.length;
    const pageTotal = regularCount + featuredCount;
    const featuredInfo = featuredCount > 0 ? ` (${regularCount} regular + ${featuredCount} featured)` : '';
    log.info(`Fetched page 1/${totalPages} for ${region}: ${pageTotal} jobs${featuredInfo}`);

    // Check if we're done or limited
    if (totalPages === 1 || (limit > 0 && allJobs.length >= limit)) {
        if (limit > 0 && allJobs.length >= limit) {
            log.info(`Reached limit of ${limit} jobs for ${region}`);
        }
        log.info(`Fetched ${allJobs.length} total jobs for ${region}`);
        return allJobs;
    }

    // Fetch remaining pages in parallel
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    log.debug(`Fetching pages 2-${totalPages} for ${region} in parallel`);

    const remainingResponses = await Promise.all(remainingPages.map(async (page) => fetchJobsPage(region, page)));

    for (let i = 0; i < remainingResponses.length; i++) {
        const response = remainingResponses[i];
        const page = remainingPages[i];

        allJobs.push(...response.jobs.docs);

        log.info(`Fetched page ${page}/${totalPages} for ${region}: ${response.jobs.docs.length} jobs`);

        // Stop adding if we've reached the limit
        if (limit > 0 && allJobs.length >= limit) {
            log.info(`Reached limit of ${limit} jobs for ${region}`);
            break;
        }
    }

    log.info(`Fetched ${allJobs.length} total jobs for ${region}`);

    return allJobs;
}

/**
 * Fetch all jobs for multiple regions (in parallel)
 * @param regions - Array of region codes to fetch jobs for
 * @param limit - Optional limit on total number of jobs to fetch (0 = unlimited)
 */
export async function fetchAllJobs(regions: RegionCode[], limit = 0): Promise<JobListingBasic[]> {
    const seenJobIds = new Set<string>();
    const allJobs: JobListingBasic[] = [];

    // Fetch all regions in parallel
    const regionResults = await Promise.all(regions.map(async (region) => fetchAllJobsForRegion(region, 0)));

    // Combine and deduplicate results
    for (const jobs of regionResults) {
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

        // Stop if we've reached the limit
        if (limit > 0 && allJobs.length >= limit) {
            break;
        }
    }

    log.info(`Fetched ${allJobs.length} unique jobs across ${regions.length} regions`);

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
