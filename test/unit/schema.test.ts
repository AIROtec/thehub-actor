import { describe, expect, it } from 'vitest';

import {
    type JobOutput,
    validateJobOutputSchema,
    validateTestCaseHasValues,
} from '../helpers/schema-validator.js';

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
        salaryRange: {
            min: 5000,
            max: 7000,
        },
        equity: '0.1-0.5%',
        jobRole: 'Engineering',
        jobPositionTypes: ['Full-time'],
        views: {
            week: 150,
            total: 1200,
        },
        link: 'https://apply.workable.com/test',
        createdAt: '2025-01-15T10:00:00.000Z',
        publishedAt: '2025-01-16T10:00:00.000Z',
        expirationDate: '2025-03-16T10:00:00.000Z',
        scrapedAt: new Date().toISOString(),
    };

    describe('validateJobOutputSchema', () => {
        it('should pass validation for valid job data', () => {
            const result = validateJobOutputSchema(validJobData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail if data is not an object', () => {
            const result = validateJobOutputSchema(null);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('data must be an object');
        });

        it('should fail if id is missing or empty', () => {
            const data = { ...validJobData, id: '' };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('id is required and must be a non-empty string');
        });

        it('should fail if url is missing or empty', () => {
            const data = { ...validJobData, url: '' };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('url is required and must be a non-empty string');
        });

        it('should fail if url is not a valid URL', () => {
            const data = { ...validJobData, url: 'not-a-valid-url' };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('url must be a valid URL');
        });

        it('should fail if title is missing or empty', () => {
            const data = { ...validJobData, title: '' };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('title is required and must be a non-empty string');
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

        it('should fail if company is missing', () => {
            const { company: _, ...dataWithoutCompany } = validJobData;
            const result = validateJobOutputSchema(dataWithoutCompany);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('company must be an object');
        });

        it('should fail if company.name is not a string', () => {
            const data = {
                ...validJobData,
                company: { ...validJobData.company, name: 123 as unknown as string },
            };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes('company.name must be a string'))).toBe(true);
        });

        it('should fail if location is missing', () => {
            const { location: _, ...dataWithoutLocation } = validJobData;
            const result = validateJobOutputSchema(dataWithoutLocation);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('location must be an object');
        });

        it('should fail if views is missing', () => {
            const { views: _, ...dataWithoutViews } = validJobData;
            const result = validateJobOutputSchema(dataWithoutViews);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('views must be an object');
        });

        it('should fail if views.week is not a number', () => {
            const data = {
                ...validJobData,
                views: { ...validJobData.views, week: '150' as unknown as number },
            };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('views.week must be a number');
        });

        it('should fail if scrapedAt is not a valid ISO date', () => {
            const data = { ...validJobData, scrapedAt: 'invalid date' };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('scrapedAt must be a valid ISO date string');
        });

        it('should pass with valid salaryRange', () => {
            const data = {
                ...validJobData,
                salaryRange: { min: 5000, max: 7000 },
            };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(true);
        });

        it('should fail if salaryRange has invalid types', () => {
            const data = {
                ...validJobData,
                salaryRange: { min: '5000' as unknown as number, max: 7000 },
            };
            const result = validateJobOutputSchema(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('salaryRange.min must be a number');
        });

        it('should pass without optional salaryRange', () => {
            const { salaryRange: _, ...dataWithoutSalaryRange } = validJobData;
            const result = validateJobOutputSchema(dataWithoutSalaryRange);
            expect(result.isValid).toBe(true);
        });

        describe('missing required string fields', () => {
            it('should fail if key is missing or empty', () => {
                const data = { ...validJobData, key: '' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('key is required and must be a non-empty string');
            });

            it('should fail if description is missing or empty', () => {
                const data = { ...validJobData, description: '' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('description is required and must be a non-empty string');
            });

            it('should fail if salary is missing or empty', () => {
                const data = { ...validJobData, salary: '' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('salary is required and must be a non-empty string');
            });

            it('should fail if equity is missing or empty', () => {
                const data = { ...validJobData, equity: '' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('equity is required and must be a non-empty string');
            });

            it('should fail if jobRole is missing or empty', () => {
                const data = { ...validJobData, jobRole: '' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('jobRole is required and must be a non-empty string');
            });

            it('should fail if createdAt is missing or empty', () => {
                const data = { ...validJobData, createdAt: '' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('createdAt is required and must be a non-empty string');
            });

            it('should fail if publishedAt is missing or empty', () => {
                const data = { ...validJobData, publishedAt: '' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('publishedAt is required and must be a non-empty string');
            });
        });

        describe('URL validation', () => {
            it('should fail for ftp protocol', () => {
                const data = { ...validJobData, url: 'ftp://thehub.io/jobs/test' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('url must have http or https protocol');
            });

            it('should pass for http protocol', () => {
                const data = { ...validJobData, url: 'http://thehub.io/jobs/test' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });

            it('should pass for https protocol', () => {
                const data = { ...validJobData, url: 'https://thehub.io/jobs/test' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });
        });

        describe('optional fields', () => {
            it('should pass without optional link', () => {
                const { link: _, ...dataWithoutLink } = validJobData;
                const result = validateJobOutputSchema(dataWithoutLink);
                expect(result.isValid).toBe(true);
            });

            it('should pass without optional expirationDate', () => {
                const { expirationDate: _, ...dataWithoutExpiration } = validJobData;
                const result = validateJobOutputSchema(dataWithoutExpiration);
                expect(result.isValid).toBe(true);
            });

            it('should pass without optional company.whatWeDo', () => {
                const { whatWeDo: _, ...companyWithoutWhatWeDo } = validJobData.company;
                const data = { ...validJobData, company: companyWithoutWhatWeDo };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });

            it('should pass without optional company.logoUrl', () => {
                const { logoUrl: _, ...companyWithoutLogo } = validJobData.company;
                const data = { ...validJobData, company: companyWithoutLogo };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });
        });

        describe('company field variations', () => {
            it('should fail if company.id is not a string', () => {
                const data = {
                    ...validJobData,
                    company: { ...validJobData.company, id: 123 as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('company.id must be a string');
            });

            it('should fail if company.key is not a string', () => {
                const data = {
                    ...validJobData,
                    company: { ...validJobData.company, key: null as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('company.key must be a string');
            });

            it('should fail if company.website is not a string', () => {
                const data = {
                    ...validJobData,
                    company: { ...validJobData.company, website: undefined as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('company.website must be a string');
            });

            it('should fail if company.numberOfEmployees is not a string', () => {
                const data = {
                    ...validJobData,
                    company: { ...validJobData.company, numberOfEmployees: 50 as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('company.numberOfEmployees must be a string');
            });

            it('should fail if company.founded is not a string', () => {
                const data = {
                    ...validJobData,
                    company: { ...validJobData.company, founded: 2020 as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('company.founded must be a string');
            });
        });

        describe('location field variations', () => {
            it('should fail if location.country is not a string', () => {
                const data = {
                    ...validJobData,
                    location: { ...validJobData.location, country: null as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('location.country must be a string');
            });

            it('should fail if location.locality is not a string', () => {
                const data = {
                    ...validJobData,
                    location: { ...validJobData.location, locality: 123 as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('location.locality must be a string');
            });

            it('should fail if location.address is not a string', () => {
                const data = {
                    ...validJobData,
                    location: { ...validJobData.location, address: [] as unknown as string },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('location.address must be a string');
            });
        });

        describe('views field variations', () => {
            it('should fail if views.total is not a number', () => {
                const data = {
                    ...validJobData,
                    views: { ...validJobData.views, total: '1200' as unknown as number },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('views.total must be a number');
            });

            it('should pass with zero views', () => {
                const data = {
                    ...validJobData,
                    views: { week: 0, total: 0 },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });
        });

        describe('salaryRange variations', () => {
            it('should fail if salaryRange.max is not a number', () => {
                const data = {
                    ...validJobData,
                    salaryRange: { min: 5000, max: '7000' as unknown as number },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('salaryRange.max must be a number');
            });

            it('should pass with zero salary range values', () => {
                const data = {
                    ...validJobData,
                    salaryRange: { min: 0, max: 0 },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });

            it('should fail if salaryRange is not an object', () => {
                const data = {
                    ...validJobData,
                    salaryRange: 'invalid' as unknown as { min: number; max: number },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('salaryRange must be an object when present');
            });

            it('should fail if salaryRange is null', () => {
                const data = {
                    ...validJobData,
                    salaryRange: null as unknown as { min: number; max: number },
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('salaryRange must be an object when present');
            });
        });

        describe('date format variations', () => {
            it('should pass with date-only format (YYYY-MM-DD)', () => {
                const data = {
                    ...validJobData,
                    createdAt: '2025-01-15',
                    publishedAt: '2025-01-16',
                    scrapedAt: '2025-01-17',
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });

            it('should pass with full ISO format', () => {
                const data = {
                    ...validJobData,
                    createdAt: '2025-01-15T10:30:00.000Z',
                    publishedAt: '2025-01-16T10:30:00.000Z',
                    scrapedAt: '2025-01-17T10:30:00.000Z',
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });

            it('should fail with invalid date format', () => {
                const data = { ...validJobData, createdAt: '15/01/2025' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('createdAt must be a valid ISO date string');
            });

            it('should fail with text date format', () => {
                const data = { ...validJobData, publishedAt: 'January 15, 2025' };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('publishedAt must be a valid ISO date string');
            });
        });

        describe('array variations', () => {
            it('should pass with empty jobPositionTypes array', () => {
                const data = { ...validJobData, jobPositionTypes: [] };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });

            it('should pass with multiple jobPositionTypes', () => {
                const data = { ...validJobData, jobPositionTypes: ['Full-time', 'Remote', 'Contract'] };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(true);
            });
        });

        describe('multiple errors', () => {
            it('should report multiple errors at once', () => {
                const data = {
                    ...validJobData,
                    id: '',
                    title: '',
                    url: 'invalid',
                    isRemote: 'yes' as unknown as boolean,
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(1);
                expect(result.errors).toContain('id is required and must be a non-empty string');
                expect(result.errors).toContain('title is required and must be a non-empty string');
                expect(result.errors).toContain('isRemote must be a boolean');
            });

            it('should handle completely invalid data', () => {
                const data = {
                    id: 123,
                    title: null,
                    url: '',
                };
                const result = validateJobOutputSchema(data);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(5);
            });
        });

        describe('edge cases', () => {
            it('should handle undefined as input', () => {
                const result = validateJobOutputSchema(undefined);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('data must be an object');
            });

            it('should handle array as input', () => {
                const result = validateJobOutputSchema([validJobData]);
                expect(result.isValid).toBe(false);
            });

            it('should handle empty object', () => {
                const result = validateJobOutputSchema({});
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(5);
            });
        });
    });

    describe('validateTestCaseHasValues', () => {
        it('should pass validation for meaningful test data', () => {
            const result = validateTestCaseHasValues(validJobData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail if title is too short', () => {
            const data = { ...validJobData, title: 'AB' };
            const result = validateTestCaseHasValues(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('title should be at least 3 characters long');
        });

        it('should fail if description is too short', () => {
            const data = { ...validJobData, description: 'Too short' };
            const result = validateTestCaseHasValues(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('description should be at least 10 characters long');
        });

        it('should fail if url is not a thehub.io job URL', () => {
            const data = { ...validJobData, url: 'https://example.com/jobs/123' };
            const result = validateTestCaseHasValues(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('url should be a valid thehub.io job URL');
        });

        it('should fail if company.name is too short', () => {
            const data = {
                ...validJobData,
                company: { ...validJobData.company, name: 'A' },
            };
            const result = validateTestCaseHasValues(data);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('company.name should be at least 2 characters long');
        });
    });
});
