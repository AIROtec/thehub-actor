#!/usr/bin/env tsx
/**
 * Delete Build Script
 *
 * This script deletes a specific Actor build using the Apify API.
 * Used in CI/CD to clean up failed builds that won't be promoted to latest.
 *
 * Usage:
 *   tsx scripts/delete-build.ts <build-id>
 *   BUILD_ID=xyz tsx scripts/delete-build.ts
 */

import { ApifyClient } from 'apify-client';

async function main() {
    // Get build ID from args or env
    const buildId = process.argv[2] || process.env.BUILD_ID;

    if (!buildId) {
        console.error('❌ Error: BUILD_ID is required');
        console.error('Usage: tsx scripts/delete-build.ts <build-id>');
        console.error('   or: BUILD_ID=xyz tsx scripts/delete-build.ts');
        process.exit(1);
    }

    const token = process.env.APIFY_TOKEN;
    if (!token) {
        console.error('❌ Error: APIFY_TOKEN environment variable is required');
        process.exit(1);
    }

    console.log('\n🗑️  Deleting failed build\n');
    console.log(`Build ID: ${buildId}\n`);

    const client = new ApifyClient({ token });

    try {
        // Get build information first to confirm it exists
        console.log('Fetching build information...');
        const build = await client.build(buildId).get();

        if (!build) {
            console.error('⚠️  Warning: Build not found (may have been already deleted)');
            process.exit(0);
        }

        console.log(`Actor ID: ${build.actId}`);
        console.log(`Build number: ${build.buildNumber}`);
        console.log(`Build tag: ${build.buildTag || '(none)'}`);

        // Delete the build
        console.log('\nDeleting build...');
        await client.build(buildId).delete();

        console.log('✅ Successfully deleted build');
        console.log(`\nBuild ${buildId} (build number ${build.buildNumber}) has been removed from Apify`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error deleting build:', error);

        if (error instanceof Error) {
            console.error(`Message: ${error.message}`);
        }

        process.exit(1);
    }
}

main();
