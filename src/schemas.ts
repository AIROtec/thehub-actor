/**
 * Zod schemas for runtime validation of scraped data
 */

import { z } from 'zod';

/**
 * Schema for company data in job output
 */
export const CompanyOutputSchema = z.object({
    id: z.string().min(1),
    key: z.string().min(1),
    name: z.string().min(1),
    website: z.string(), // Can be empty for some companies
    numberOfEmployees: z.string(),
    founded: z.string(),
    whatWeDo: z.string().optional(),
    logoUrl: z.string().optional(),
});

/**
 * Schema for location data (fields can be empty or missing for some jobs)
 */
export const LocationSchema = z.object({
    country: z.string().optional(),
    locality: z.string().optional(),
    address: z.string().optional(),
});

/**
 * Schema for view statistics
 */
export const ViewsSchema = z.object({
    week: z.number(),
    total: z.number(),
});

/**
 * Schema for salary range
 */
export const SalaryRangeSchema = z.object({
    min: z.number(),
    max: z.number(),
});

/**
 * Schema for job output - validates data before pushing to dataset
 */
export const JobOutputSchema = z.object({
    id: z.string().min(1),
    key: z.string().min(1),
    url: z
        .string()
        .url()
        .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
            message: 'URL must use http or https protocol',
        }),
    title: z.string().min(1),
    description: z.string().min(1),
    company: CompanyOutputSchema,
    location: LocationSchema.optional(),
    isRemote: z.boolean(),
    salary: z.string().min(1),
    salaryRange: SalaryRangeSchema.optional(),
    equity: z.string().min(1),
    jobRole: z.string().min(1),
    jobPositionTypes: z.array(z.string()),
    views: ViewsSchema,
    link: z.string().optional(),
    createdAt: z.string().datetime(),
    publishedAt: z.string().datetime(),
    expirationDate: z.string().date().optional(),
    scrapedAt: z.string().datetime(),
});

export type JobOutputValidated = z.infer<typeof JobOutputSchema>;
