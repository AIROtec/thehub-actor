/**
 * Request handlers for thehub.io job scraper
 */

import { Actor } from 'apify';
import { createCheerioRouter } from 'crawlee';

import { buildImageUrl } from './api.js';
import { extractJobFromHtml } from './nuxtExtractor.js';
import type { JobOutput } from './types.js';
import { translateJobPositionTypes } from './types.js';

export const router = createCheerioRouter();

/**
 * Handler for individual job detail pages
 * Extracts full job data from __NUXT__ SSR state
 */
router.addHandler('job-detail', async ({ request, body, log }) => {
    const url = request.loadedUrl || request.url;
    const jobId = (request.userData as { jobId?: string })?.jobId;

    log.info(`Processing job: ${url}`);

    try {
        const html = body.toString();
        const job = extractJobFromHtml(html);

        if (!job) {
            log.error(`Failed to extract job data from ${url}`);
            await Actor.pushData({
                url,
                jobId,
                error: 'Failed to extract job data',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Build the logo URL if available
        let logoUrl: string | undefined;
        if (job.company?.logoImage?.path) {
            logoUrl = buildImageUrl(job.company.logoImage.path);
        }

        const jobOutput: JobOutput = {
            id: job.id,
            key: job.key,
            url,
            title: job.title,
            description: job.description,
            company: {
                id: job.company.id,
                key: job.company.key,
                name: job.company.name,
                website: job.company.website,
                numberOfEmployees: job.company.numberOfEmployees,
                founded: job.company.founded,
                whatWeDo: job.company.whatWeDo,
                logoUrl,
            },
            location: job.location,
            isRemote: job.isRemote,
            salary: job.salary,
            salaryRange: job.salaryRange,
            equity: job.equity,
            jobRole: job.jobRole,
            jobPositionTypes: translateJobPositionTypes(job.jobPositionTypes),
            views: job.views,
            link: job.link || undefined, // Convert empty string to undefined
            createdAt: job.createdAt,
            publishedAt: job.publishedAt || job.createdAt,
            expirationDate: job.expirationDate,
            scrapedAt: new Date().toISOString(),
        };

        await Actor.pushData(jobOutput);

        log.info(`Successfully extracted: "${job.title}" at ${job.company.name}`);
    } catch (error) {
        log.error(`Error processing job ${url}: ${error}`);
        await Actor.pushData({
            url,
            jobId,
            error: String(error),
            timestamp: new Date().toISOString(),
        });
        throw error;
    }
});

/**
 * Default handler (fallback for any unhandled routes)
 */
router.addDefaultHandler(async ({ request, log }) => {
    log.warning(`Unhandled route: ${request.url}`);
});
