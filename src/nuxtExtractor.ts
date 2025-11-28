/**
 * Utility to extract __NUXT__ data from thehub.io job pages
 *
 * thehub.io uses Nuxt.js SSR and embeds the full job data in the HTML
 * as an IIFE (Immediately Invoked Function Expression).
 */

import { log } from '@crawlee/core';

import type { JobFull, NuxtState } from './types.js';

// Regex to extract __NUXT__ IIFE content - avoids full DOM parsing
const NUXT_REGEX = /window\.__NUXT__=(\(function\([^)]*\)\{return \{[\s\S]*?\}\}\([^)]*\)\))/;

/**
 * Extract the __NUXT__ data from HTML and return the job object
 *
 * The data is embedded as:
 * <script>window.__NUXT__=(function(a,b,c,...){return {...}}("value1","value2",...))</script>
 *
 * Uses regex extraction instead of full DOM parsing for better performance.
 */
export function extractJobFromHtml(html: string): JobFull | null {
    const match = NUXT_REGEX.exec(html);

    if (match?.[1]) {
        try {
            // eslint-disable-next-line no-eval
            const nuxtData = eval(match[1]) as NuxtState;

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

    log.warning('No __NUXT__ script found in HTML');
    return null;
}

/**
 * Extract just the raw __NUXT__ state object (for debugging)
 */
export function extractNuxtState(html: string): NuxtState | null {
    const match = NUXT_REGEX.exec(html);

    if (match?.[1]) {
        try {
            // eslint-disable-next-line no-eval
            return eval(match[1]) as NuxtState;
        } catch (error) {
            log.error(`Failed to parse __NUXT__ data: ${error}`);
            return null;
        }
    }

    return null;
}
