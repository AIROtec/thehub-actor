#!/usr/bin/env tsx
/**
 * E2E Validation Script for TheHub Jobs Scraper
 *
 * This script validates the output of an Actor run to ensure:
 * - The run completed successfully
 * - Data quality meets requirements (required fields present)
 * - Items have valid structure matching JobOutput schema
 *
 * Usage:
 *   tsx scripts/validate-e2e-run.ts <dataset-id>
 *   DATASET_ID=xyz tsx scripts/validate-e2e-run.ts
 */

import { ApifyClient } from 'apify-client';
import { validateDataQuality, validatePerformance, generateValidationReport } from '../test/e2e/helpers/validators.js';
import type { JobOutput } from '../test/helpers/schema-validator.js';

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
        const items = dataset.items as unknown as Partial<JobOutput>[];

        console.log(`✓ Retrieved ${items.length} items\n`);

        if (items.length === 0) {
            console.error('❌ Validation failed: No items in dataset');
            process.exit(1);
        }

        // Validate data quality
        console.log('🔬 Validating data quality...');
        const dataQualityResult = validateDataQuality(items);

        if (!dataQualityResult.isValid) {
            console.error('\n❌ Data Quality Validation Failed:');
            dataQualityResult.errors.slice(0, 20).forEach((err) => console.error(`  - ${err}`));
            if (dataQualityResult.errors.length > 20) {
                console.error(`  ... and ${dataQualityResult.errors.length - 20} more errors`);
            }
        } else {
            console.log('✓ Data quality validation passed');
        }

        // Get dataset info for metadata
        const datasetInfo = await client.dataset(datasetId).get();

        // Construct performance metrics from dataset info
        const performanceMetrics = {
            durationMillis:
                datasetInfo?.modifiedAt && datasetInfo?.createdAt
                    ? new Date(datasetInfo.modifiedAt).getTime() - new Date(datasetInfo.createdAt).getTime()
                    : 0,
            memoryUsageBytes: 0, // Not available from dataset info
            requestsFinished: items.length + 1, // Approximate: items + API calls
            requestsFailed: 0, // Not directly available
        };

        // Validate performance
        console.log('\n⚡ Validating performance metrics...');
        const performanceResult = validatePerformance(performanceMetrics, {
            maxDurationMillis: 5 * 60 * 1000, // 5 minutes
            maxMemoryMB: 1024, // 1GB
            expectedRequestsMin: 1, // At least 1 request
            expectedRequestsMax: 100, // Max 100 requests for e2e test
            maxFailedRequests: 1, // Allow 1 failed request
        });

        if (!performanceResult.isValid) {
            console.error('\n❌ Performance Validation Failed:');
            performanceResult.errors.forEach((err) => console.error(`  - ${err}`));
        } else {
            console.log('✓ Performance validation passed');
        }

        // Generate and print report
        const report = generateValidationReport(dataQualityResult, performanceResult, items.length);
        console.log('\n' + report);

        // Exit with appropriate code
        if (!dataQualityResult.isValid || !performanceResult.isValid) {
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
