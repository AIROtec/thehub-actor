import { describe, expect, it } from 'vitest';

import { COUNTRY_CODES, JOB_POSITION_TYPE_MAP, translateJobPositionTypes } from '../../src/types.js';

describe('JOB_POSITION_TYPE_MAP', () => {
    it('should have all expected position type IDs', () => {
        const expectedIds = [
            '5b8e46b3853f039706b6ea70', // Full-time
            '5b8e46b3853f039706b6ea71', // Part-time
            '5b8e46b3853f039706b6ea72', // Student
            '5b8e46b3853f039706b6ea73', // Internship
            '5b8e46b3853f039706b6ea74', // Cofounder
            '5b8e46b3853f039706b6ea75', // Freelance
            '62e28180d8cca695ee60c98e', // Advisory board
        ];

        expectedIds.forEach((id) => {
            expect(JOB_POSITION_TYPE_MAP).toHaveProperty(id);
        });
    });

    it('should have human-readable labels for all position types', () => {
        const expectedLabels: Record<string, string> = {
            '5b8e46b3853f039706b6ea70': 'Full-time',
            '5b8e46b3853f039706b6ea71': 'Part-time',
            '5b8e46b3853f039706b6ea72': 'Student',
            '5b8e46b3853f039706b6ea73': 'Internship',
            '5b8e46b3853f039706b6ea74': 'Cofounder',
            '5b8e46b3853f039706b6ea75': 'Freelance',
            '62e28180d8cca695ee60c98e': 'Advisory board',
        };

        Object.entries(expectedLabels).forEach(([id, label]) => {
            expect(JOB_POSITION_TYPE_MAP[id]).toBe(label);
        });
    });

    it('should have non-empty labels for all entries', () => {
        Object.entries(JOB_POSITION_TYPE_MAP).forEach(([id, label]) => {
            expect(label, `Position type ${id} should have a non-empty label`).toBeTruthy();
            expect(typeof label).toBe('string');
            expect(label.length).toBeGreaterThan(0);
        });
    });
});

describe('translateJobPositionTypes', () => {
    it('should translate known position type IDs to labels', () => {
        const ids = ['5b8e46b3853f039706b6ea70', '5b8e46b3853f039706b6ea71'];
        const result = translateJobPositionTypes(ids);
        expect(result).toEqual(['Full-time', 'Part-time']);
    });

    it('should return original ID for unknown position types', () => {
        const ids = ['unknown-id-123'];
        const result = translateJobPositionTypes(ids);
        expect(result).toEqual(['unknown-id-123']);
    });

    it('should handle mixed known and unknown IDs', () => {
        const ids = ['5b8e46b3853f039706b6ea70', 'unknown-id', '5b8e46b3853f039706b6ea73'];
        const result = translateJobPositionTypes(ids);
        expect(result).toEqual(['Full-time', 'unknown-id', 'Internship']);
    });

    it('should handle empty array', () => {
        const result = translateJobPositionTypes([]);
        expect(result).toEqual([]);
    });

    it('should translate all known position types correctly', () => {
        const allIds = Object.keys(JOB_POSITION_TYPE_MAP);
        const result = translateJobPositionTypes(allIds);

        allIds.forEach((id, index) => {
            expect(result[index]).toBe(JOB_POSITION_TYPE_MAP[id]);
        });
    });
});

describe('COUNTRY_CODES', () => {
    it('should contain all Nordic countries', () => {
        expect(COUNTRY_CODES).toContain('FI'); // Finland
        expect(COUNTRY_CODES).toContain('SE'); // Sweden
        expect(COUNTRY_CODES).toContain('DK'); // Denmark
        expect(COUNTRY_CODES).toContain('NO'); // Norway
        expect(COUNTRY_CODES).toContain('IS'); // Iceland
    });

    it('should contain EU and REMOTE options', () => {
        expect(COUNTRY_CODES).toContain('EU');
        expect(COUNTRY_CODES).toContain('REMOTE');
    });

    it('should have exactly 7 country codes', () => {
        expect(COUNTRY_CODES).toHaveLength(7);
    });
});
