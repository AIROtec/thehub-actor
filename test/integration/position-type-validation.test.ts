import * as fs from 'node:fs';
import * as path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { JOB_POSITION_TYPE_MAP } from '../../src/types.js';

/**
 * Expected job position type IDs - the known baseline
 * Must match the keys in JOB_POSITION_TYPE_MAP in src/types.ts
 */
const EXPECTED_POSITION_TYPE_IDS = Object.keys(JOB_POSITION_TYPE_MAP).sort();

interface JobsApiResponse {
    jobs: {
        suggestions?: {
            jobPositionTypes: Record<string, number>;
        };
    };
}

interface PositionTypeChangeReport {
    timestamp: string;
    added: { id: string; count: number }[];
    removed: string[];
    currentIds: string[];
    previousIds: string[];
}

/**
 * Fetch job position types from the thehub.io API
 */
async function fetchLivePositionTypes(): Promise<Record<string, number>> {
    const response = await fetch('https://thehub.io/api/v2/jobsandfeatured?countryCode=FI&page=1&sorting=mostPopular');

    if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as JobsApiResponse;
    return data.jobs.suggestions?.jobPositionTypes ?? {};
}

describe('thehub.io Job Position Type Validation', () => {
    let detectedChanges: PositionTypeChangeReport | null = null;

    afterAll(() => {
        if (detectedChanges) {
            const outputPath = path.join(process.cwd(), '.detected-position-types.json');
            fs.writeFileSync(outputPath, JSON.stringify(detectedChanges, null, 2));
            console.log(`\nPosition type changes detected! Written to ${outputPath}`);
            console.log('This will trigger the automated PR workflow.');
        }
    });

    it('should be able to fetch position types from the API', async () => {
        const positionTypes = await fetchLivePositionTypes();
        expect(positionTypes).toBeDefined();
        expect(typeof positionTypes).toBe('object');
        expect(Object.keys(positionTypes).length).toBeGreaterThan(0);
    });

    it('should have position types matching the expected baseline', async () => {
        const livePositionTypes = await fetchLivePositionTypes();
        const currentIds = Object.keys(livePositionTypes).sort();

        const added = currentIds
            .filter((id) => !EXPECTED_POSITION_TYPE_IDS.includes(id))
            .map((id) => ({ id, count: livePositionTypes[id] }));
        const removed = EXPECTED_POSITION_TYPE_IDS.filter((id) => !currentIds.includes(id));

        // Log any changes for visibility
        if (added.length > 0 || removed.length > 0) {
            console.log('\n=== POSITION TYPE CHANGES DETECTED ===');
            if (added.length > 0) {
                console.log('NEW position types (need labels):');
                added.forEach(({ id, count }) => console.log(`  - ${id} (${count} jobs)`));
            }
            if (removed.length > 0) {
                console.log('Missing from API (may just have no active jobs):', removed);
            }
            console.log(`Map count: ${EXPECTED_POSITION_TYPE_IDS.length}`);
            console.log(`API count: ${currentIds.length}`);
            console.log('======================================\n');
        }

        // Only write changes file and trigger PR workflow for NEW position types
        if (added.length > 0) {
            detectedChanges = {
                timestamp: new Date().toISOString(),
                added,
                removed,
                currentIds,
                previousIds: [...EXPECTED_POSITION_TYPE_IDS],
            };
        }

        // Only fail on new position types (they need labels added to the map)
        // Removed types are just warnings - they may reappear when jobs use them
        expect(added, 'New position types detected that are not in JOB_POSITION_TYPE_MAP').toEqual([]);
    });

    it('should have human-readable labels for all position types', () => {
        for (const [id, label] of Object.entries(JOB_POSITION_TYPE_MAP)) {
            expect(label, `Position type ${id} should have a non-empty label`).toBeTruthy();
            expect(typeof label, `Position type ${id} label should be a string`).toBe('string');
        }
    });
});
