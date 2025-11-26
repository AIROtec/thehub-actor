import { describe, expect, it } from 'vitest';

import { type JobOutput, validateJobOutputSchema, validateTestCaseHasValues } from '../helpers/schema-validator.js';

describe('Schema Validation', () => {
    const validJobData: JobOutput = {
        id: '123abc',
        key: 'test-job-key',
        url: 'https://thehub.io/jobs/test-job-key',
        title: 'Senior Software Engineer',
        description: 'This is a detailed job description with all the requirements and responsibilities.',
        company: {
            id: 'company123',
            key: 'test-company',
            name: 'Test Company',
            website: 'https://testcompany.com',
            numberOfEmployees: '50-100',
            founded: '2020',
            whatWeDo: 'We build great software',
            logoUrl: 'https://example.com/logo.png',
        },
        location: {
            country: 'Finland',
            locality: 'Helsinki',
            address: 'Mannerheimintie 1, Helsinki',
        },
        isRemote: true,
        salary: '€5000-7000/month',
        salaryRange: { min: 5000, max: 7000 },
        equity: '0.1-0.5%',
        jobRole: 'Engineering',
        jobPositionTypes: ['Full-time'],
        views: { week: 150, total: 1200 },
        link: 'https://apply.workable.com/test',
        createdAt: '2025-01-15T10:00:00.000Z',
        publishedAt: '2025-01-16T10:00:00.000Z',
        expirationDate: '2025-03-16T10:00:00.000Z',
        scrapedAt: new Date().toISOString(),
    };

    describe('validateJobOutputSchema', () => {
        it('should pass for valid job data', () => {
            const result = validateJobOutputSchema(validJobData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it.each([null, undefined, [validJobData], 'string', 123])('should fail for non-object input: %s', (input) => {
            const result = validateJobOutputSchema(input);
            expect(result.isValid).toBe(false);
        });

        it.each([
            'id',
            'key',
            'url',
            'title',
            'description',
            'salary',
            'equity',
            'jobRole',
            'createdAt',
            'publishedAt',
            'scrapedAt',
        ])('should fail if %s is empty', (field) => {
            const data = { ...validJobData, [field]: '' };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`${field} is required and must be a non-empty string`);
        });

        it.each([
            ['ftp://example.com', false, 'url must have http or https protocol'],
            ['not-a-url', false, 'url must be a valid URL'],
            ['http://example.com', true, null],
            ['https://example.com', true, null],
        ])('URL validation: %s should be valid=%s', (url, shouldPass, expectedError) => {
            const data = { ...validJobData, url };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(shouldPass);
            if (expectedError) expect(result.errors).toContain(expectedError);
        });

        it.each(['company', 'location', 'views'])('should fail if %s is missing', (field) => {
            const { [field]: _, ...data } = validJobData;
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`${field} must be an object`);
        });

        it.each(['id', 'key', 'name', 'website', 'numberOfEmployees', 'founded'])(
            'should fail if company.%s is not a string',
            (field) => {
                const data = { ...validJobData, company: { ...validJobData.company, [field]: 123 } };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(`company.${field} must be a string`);
            },
        );

        it.each(['country', 'locality', 'address'])('should fail if location.%s is not a string', (field) => {
            const data = { ...validJobData, location: { ...validJobData.location, [field]: 123 } };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`location.${field} must be a string`);
        });

        it.each(['week', 'total'])('should fail if views.%s is not a number', (field) => {
            const data = { ...validJobData, views: { ...validJobData.views, [field]: 'string' } };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`views.${field} must be a number`);
        });

        it('should fail if isRemote is not a boolean', () => {
            const data = { ...validJobData, isRemote: 'yes' as unknown as boolean };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('isRemote must be a boolean');
        });

        it('should fail if jobPositionTypes is not an array', () => {
            const data = { ...validJobData, jobPositionTypes: 'Full-time' as unknown as string[] };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('jobPositionTypes must be an array');
        });

        describe('salaryRange', () => {
            it.each([
                [{ min: 5000, max: 7000 }, true],
                [{ min: 0, max: 0 }, true],
                [undefined, true],
            ])('should pass for valid salaryRange: %s', (salaryRange, shouldPass) => {
                const { salaryRange: _, ...base } = validJobData;
                const data = salaryRange ? { ...base, salaryRange } : base;
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(shouldPass);
            });

            it.each([
                [{ min: '5000', max: 7000 }, 'salaryRange.min must be a number'],
                [{ min: 5000, max: '7000' }, 'salaryRange.max must be a number'],
                ['invalid', 'salaryRange must be an object when present'],
                [null, 'salaryRange must be an object when present'],
            ])('should fail for invalid salaryRange: %s', (salaryRange, expectedError) => {
                const data = { ...validJobData, salaryRange: salaryRange as any };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(expectedError);
            });
        });

        describe('date formats', () => {
            it.each([
                ['2025-01-15', true],
                ['2025-01-15T10:30:00.000Z', true],
                ['15/01/2025', false],
                ['January 15, 2025', false],
                ['invalid', false],
            ])('scrapedAt=%s should be valid=%s', (scrapedAt, shouldPass) => {
                const data = { ...validJobData, scrapedAt };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(shouldPass);
            });
        });

        describe('optional fields', () => {
            it.each(['link', 'expirationDate', 'salaryRange'])('should pass without %s', (field) => {
                const { [field]: _, ...data } = validJobData;
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });

            it.each(['whatWeDo', 'logoUrl'])('should pass without company.%s', (field) => {
                const { [field]: _, ...company } = validJobData.company;
                const data = { ...validJobData, company };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });
        });

        it('should report multiple errors at once', () => {
            const data = { ...validJobData, id: '', title: '', isRemote: 'yes' as any };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(2);
        });
    });

    describe('validateTestCaseHasValues', () => {
        it('should pass for valid data', () => {
            const result = validateTestCaseHasValues(validJobData);
            expect(result.isValid).toBe(true);
        });

        it.each([
            [{ title: 'AB' }, 'title should be at least 3 characters long'],
            [{ description: 'Short' }, 'description should be at least 10 characters long'],
            [{ url: 'https://example.com/jobs/123' }, 'url should be a valid thehub.io job URL'],
            [{ company: { ...validJobData.company, name: 'A' } }, 'company.name should be at least 2 characters long'],
        ])('should fail for invalid data: %s', (override, expectedError) => {
            const data = { ...validJobData, ...override };
            const result = validateTestCaseHasValues(data as JobOutput);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(expectedError);
        });
    });
});
