#!/usr/bin/env tsx
/**
 * E2E Validation Script for TheHub Jobs Scraper
 *
 * This script validates the output of an Actor run to ensure:
 * - The run completed successfully
 * - Data quality meets requirements (required fields present)
 * - Items have valid structure
 *
 * Usage:
 *   tsx scripts/validate-e2e-run.ts <dataset-id>
 *   DATASET_ID=xyz tsx scripts/validate-e2e-run.ts
 */

import { ApifyClient } from 'apify-client';

interface JobData {
    id?: string;
    title?: string;
    description?: string;
    company?: {
        name?: string;
    };
    location?: {
        country?: string;
    };
    url?: string;
    scrapedAt?: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

function validateJobData(items: JobData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum items
    if (items.length === 0) {
        errors.push('No items in dataset');
        return { isValid: false, errors, warnings };
    }

    // Required fields for each item
    const requiredFields = ['id', 'title', 'url', 'scrapedAt'];

    let validItems = 0;
    let invalidItems = 0;

    for (const item of items) {
        // Skip error items
        if ('error' in item) {
            warnings.push(`Found error item: ${(item as any).error}`);
            continue;
        }

        let itemValid = true;

        for (const field of requiredFields) {
            if (!item[field as keyof JobData]) {
                itemValid = false;
                warnings.push(`Item ${item.id || 'unknown'} missing required field: ${field}`);
            }
        }

        // Check nested required fields
        if (!item.company?.name) {
            warnings.push(`Item ${item.id || 'unknown'} missing company.name`);
        }

        if (!item.location?.country) {
            warnings.push(`Item ${item.id || 'unknown'} missing location.country`);
        }

        // Check description exists and has content
        if (!item.description || item.description.length < 10) {
            warnings.push(`Item ${item.id || 'unknown'} has empty or very short description`);
        }

        if (itemValid) {
            validItems++;
        } else {
            invalidItems++;
        }
    }

    console.log(`\n📊 Data Summary:`);
    console.log(`   Total items: ${items.length}`);
    console.log(`   Valid items: ${validItems}`);
    console.log(`   Invalid items: ${invalidItems}`);

    // Require at least 1 valid item
    if (validItems === 0) {
        errors.push('No valid items found in dataset');
    }

    // Allow up to 50% invalid items
    if (invalidItems > items.length / 2) {
        errors.push(`Too many invalid items: ${invalidItems}/${items.length}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

async function main() {
    // Get dataset ID from args or env
    const datasetId = process.argv[2] || process.env.DATASET_ID;

    if (!datasetId) {
        console.error('❌ Error: DATASET_ID is required');
        console.error('Usage: tsx scripts/validate-e2e-run.ts <dataset-id>');
        console.error('   or: DATASET_ID=xyz tsx scripts/validate-e2e-run.ts');
        process.exit(1);
    }

    const token = process.env.APIFY_TOKEN;
    if (!token) {
        console.error('❌ Error: APIFY_TOKEN environment variable is required');
        process.exit(1);
    }

    console.log('\n🔍 Starting E2E Validation\n');
    console.log(`Dataset ID: ${datasetId}\n`);

    const client = new ApifyClient({ token });

    try {
        // Fetch dataset items
        console.log('📥 Fetching dataset items...');
        const dataset = await client.dataset(datasetId).listItems();
        const items = dataset.items as unknown as JobData[];

        console.log(`✓ Retrieved ${items.length} items\n`);

        if (items.length === 0) {
            console.error('❌ Validation failed: No items in dataset');
            process.exit(1);
        }

        // Validate data
        console.log('🔬 Validating data quality...');
        const result = validateJobData(items);

        if (result.warnings.length > 0) {
            console.warn('\n⚠️  Warnings:');
            result.warnings.slice(0, 10).forEach((warn) => console.warn(`  - ${warn}`));
            if (result.warnings.length > 10) {
                console.warn(`  ... and ${result.warnings.length - 10} more warnings`);
            }
        }

        if (!result.isValid) {
            console.error('\n❌ Validation Errors:');
            result.errors.forEach((err) => console.error(`  - ${err}`));
            console.error('\n❌ E2E Validation FAILED');
            process.exit(1);
        }

        console.log('\n✅ E2E Validation PASSED');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during validation:', error);
        process.exit(1);
    }
}

main();
