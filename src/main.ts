/**
 * thehub.io Jobs Scraper - Main entry point
 *
 * Scrapes job listings from thehub.io Nordic startup job board
 * using their REST API for listings and SSR extraction for full details.
 */

import { log } from '@crawlee/core';
import { HttpCrawler, type HttpCrawlerOptions } from '@crawlee/http';
import { Actor } from 'apify';

import { fetchAllJobs } from './api.js';
import { router } from './routes.js';
import { type Input, REGION_CODES, type RegionCode } from './types.js';

const FREE_TIER_ITEM_LIMIT = 50;

await Actor.init();

// Read input configuration
const {
    jobUrl: inputJobUrl,
    regions: inputRegions = [],
    maxRequestsPerCrawl = 0,
} = (await Actor.getInput<Input>()) ?? {};

// Use all regions if none selected
const regions = inputRegions.length > 0 ? inputRegions : [...REGION_CODES];

// Environment variable overrides
const envJobUrl = process.env.JOB_URL;
const finalJobUrl = envJobUrl || inputJobUrl;

// Determine max requests early (for limiting API fetching too)
const { userIsPaying } = Actor.getEnv();
const isFreeTier = Actor.isAtHome() && !userIsPaying;
let finalMaxRequests = process.env.MAX_PAGES_TEST ? parseInt(process.env.MAX_PAGES_TEST, 10) : maxRequestsPerCrawl;

if (isFreeTier && (finalMaxRequests === 0 || finalMaxRequests > FREE_TIER_ITEM_LIMIT)) {
    finalMaxRequests = FREE_TIER_ITEM_LIMIT;
}

let startUrls: { url: string; label?: string; userData?: Record<string, unknown> }[] = [];

if (finalJobUrl) {
    // Single job mode
    const jobIdMatch = finalJobUrl.match(/\/jobs\/([a-zA-Z0-9-]+)/);
    const jobId = jobIdMatch?.[1] || 'unknown';

    log.info(
        `Scraping single job from ${envJobUrl ? 'JOB_URL environment variable' : 'jobUrl input parameter'}: ${finalJobUrl}`,
    );

    startUrls = [
        {
            url: finalJobUrl,
            label: 'job-detail',
            userData: { jobId },
        },
    ];
} else {
    // Fetch all jobs from API for selected regions
    log.info(`Fetching jobs for regions: ${regions.join(', ')}`);

    const validRegions = regions.filter((r): r is RegionCode => REGION_CODES.includes(r as RegionCode));

    // Fetch jobs with optional limit
    const jobs = await fetchAllJobs(validRegions, finalMaxRequests);

    log.info(`Found ${jobs.length} jobs to scrape`);

    // Build start URLs for each job
    startUrls = jobs.map((job) => ({
        url: `https://thehub.io/jobs/${job.id}`,
        label: 'job-detail',
        userData: {
            jobId: job.id,
            basicInfo: {
                title: job.title,
                company: job.company.name,
            },
        },
    }));
}

// Log max requests info
if (process.env.MAX_PAGES_TEST) {
    log.info(`Maximum requests per crawl: ${finalMaxRequests} (overridden by MAX_PAGES_TEST environment variable)`);
} else if (isFreeTier) {
    log.info(`Maximum requests per crawl: ${finalMaxRequests} (free tier limit)`);
} else if (finalMaxRequests === 0) {
    log.info('Maximum requests per crawl: unlimited');
} else {
    log.info(`Maximum requests per crawl: ${finalMaxRequests}`);
}

// Configure crawler
const crawlerOptions: HttpCrawlerOptions = {
    requestHandler: router,
    requestHandlerTimeoutSecs: 60,
    maxConcurrency: 50, // High concurrency for HTTP requests (no browser)
    useSessionPool: true,
    sessionPoolOptions: {
        maxPoolSize: 50, // Match concurrency for better connection reuse
        sessionOptions: {
            maxUsageCount: 100,
            maxErrorScore: 5,
        },
    },
    failedRequestHandler: async ({ request, log: requestLog }) => {
        const url = request.loadedUrl || request.url;
        requestLog.error(`Request failed: ${url}`);

        const errorDetails = `URL: ${url}
Error Messages: ${request.errorMessages?.join(', ') || 'Unknown error'}
Retry Count: ${request.retryCount}
Timestamp: ${new Date().toISOString()}`;

        await Actor.setValue(`error-${Date.now()}.txt`, errorDetails, { contentType: 'text/plain' });
    },
};

// Only set maxRequestsPerCrawl if greater than 0
if (finalMaxRequests > 0) {
    crawlerOptions.maxRequestsPerCrawl = finalMaxRequests;
}

const crawler = new HttpCrawler(crawlerOptions);

await crawler.run(startUrls);

log.info('Crawl completed');

await Actor.exit();
