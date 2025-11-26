/**
 * Utility to extract __NUXT__ data from TheHub.io job pages
 *
 * TheHub.io uses Nuxt.js SSR and embeds the full job data in the HTML
 * as an IIFE (Immediately Invoked Function Expression).
 */

import * as cheerio from 'cheerio';
import { log } from 'crawlee';

import type { JobFull, NuxtState } from './types.js';

/**
 * Extract the __NUXT__ data from HTML and return the job object
 *
 * The data is embedded as:
 * <script>window.__NUXT__=(function(a,b,c,...){return {...}}("value1","value2",...))</script>
 */
export function extractJobFromHtml(html: string): JobFull | null {
    const $ = cheerio.load(html);

    // Find all script tags
    const scripts = $('script').toArray();

    for (const script of scripts) {
        const content = $(script).html();

        if (content?.includes('window.__NUXT__=')) {
            try {
                // Extract the IIFE and evaluate it
                const nuxtCode = content.replace('window.__NUXT__=', '');
                // eslint-disable-next-line no-eval
                const nuxtData = eval(nuxtCode) as NuxtState;

                if (nuxtData?.state?.jobs?.job) {
                    return nuxtData.state.jobs.job;
                }

                log.warning('__NUXT__ data found but no job object in state.jobs.job');
                return null;
            } catch (error) {
                log.error(`Failed to parse __NUXT__ data: ${error}`);
                return null;
            }
        }
    }

    log.warning('No __NUXT__ script found in HTML');
    return null;
}

/**
 * Extract just the raw __NUXT__ state object (for debugging)
 */
export function extractNuxtState(html: string): NuxtState | null {
    const $ = cheerio.load(html);
    const scripts = $('script').toArray();

    for (const script of scripts) {
        const content = $(script).html();

        if (content?.includes('window.__NUXT__=')) {
            try {
                const nuxtCode = content.replace('window.__NUXT__=', '');
                // eslint-disable-next-line no-eval
                return eval(nuxtCode) as NuxtState;
            } catch (error) {
                log.error(`Failed to parse __NUXT__ data: ${error}`);
                return null;
            }
        }
    }

    return null;
}
