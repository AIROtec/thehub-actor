#!/usr/bin/env tsx
/**
 * Tag Build as Latest Script
 *
 * This script tags a specific Actor build as "latest" using the Apify API.
 * Used in CI/CD after E2E tests pass to promote the tested build.
 *
 * Usage:
 *   tsx scripts/tag-build-as-latest.ts <build-id> <build-tag>
 *   BUILD_ID=xyz BUILD_TAG=abc tsx scripts/tag-build-as-latest.ts
 */

import { ApifyClient } from 'apify-client';

async function main() {
    // Get build ID and tag from args or env
    const buildId = process.argv[2] || process.env.BUILD_ID;
    const buildTag = process.argv[3] || process.env.BUILD_TAG;

    if (!buildId) {
        console.error('❌ Error: BUILD_ID is required');
        console.error('Usage: tsx scripts/tag-build-as-latest.ts <build-id> <build-tag>');
        console.error('   or: BUILD_ID=xyz BUILD_TAG=abc tsx scripts/tag-build-as-latest.ts');
        process.exit(1);
    }

    if (!buildTag) {
        console.error('❌ Error: BUILD_TAG is required');
        console.error('Usage: tsx scripts/tag-build-as-latest.ts <build-id> <build-tag>');
        console.error('   or: BUILD_ID=xyz BUILD_TAG=abc tsx scripts/tag-build-as-latest.ts');
        process.exit(1);
    }

    const token = process.env.APIFY_TOKEN;
    if (!token) {
        console.error('❌ Error: APIFY_TOKEN environment variable is required');
        process.exit(1);
    }

    const actorName = process.env.ACTOR_NAME || 'the-hub-jobs-scraper';

    console.log('\n🏷️  Tagging build as latest\n');
    console.log(`Actor: ${actorName}`);
    console.log(`Build ID: ${buildId}`);
    console.log(`Build TAG: ${buildTag}\n`);

    const client = new ApifyClient({ token });

    try {
        // Get build information to find the actor and version
        console.log('Fetching build information...');
        const build = await client.build(buildId).get();

        if (!build) {
            console.error('❌ Error: Build not found');
            process.exit(1);
        }

        console.log(`Actor ID: ${build.actId}`);
        console.log(`Build number: ${build.buildNumber}`);

        // Get version from the build's actorDefinition
        const versionNumber = (build as any).actorDefinition?.version || '0.0';
        console.log(`Version: ${versionNumber}`);
        console.log(`\nFetching version ${versionNumber} information...`);

        const version = await client.actor(build.actId).version(versionNumber).get();

        if (!version) {
            console.error('❌ Error: Actor version not found');
            process.exit(1);
        }

        console.log(`Step 1: Tagging build ${buildId} as "latest" in Actor's taggedBuilds`);

        // Update the Actor's taggedBuilds to include "latest" tag
        const actor = await client.actor(build.actId).get();
        if (!actor) {
            console.error('❌ Error: Actor not found');
            process.exit(1);
        }

        // Add "latest" tag and remove the temporary timestamp tag in the same update
        await client.actor(build.actId).update({
            taggedBuilds: {
                latest: {
                    buildId: buildId,
                },
                [buildTag]: null, // Remove the temporary timestamp tag
            },
        } as any);

        console.log('✅ Build tagged as "latest" in Actor taggedBuilds');

        console.log(`\nStep 2: Updating version ${versionNumber} to use build tag "latest"`);

        // Set the version's buildTag to "latest"
        await client
            .actor(build.actId)
            .version(versionNumber)
            .update({
                ...version,
                buildTag: 'latest',
            });

        console.log('✅ Version buildTag updated to "latest"');

        console.log('\nVerifying buildTag was set correctly...');

        // Verify version buildTag
        const updatedVersion = await client.actor(build.actId).version(versionNumber).get();
        if (!updatedVersion) {
            console.error('❌ Error: Could not fetch updated version for verification');
            process.exit(1);
        }

        if (updatedVersion.buildTag !== 'latest') {
            console.error('❌ Error: Version buildTag was not updated correctly');
            console.error(`Expected buildTag: latest`);
            console.error(`Actual buildTag: ${updatedVersion.buildTag}`);
            process.exit(1);
        }

        console.log(`✅ Verified: Version ${versionNumber} buildTag is set to "latest"`);
        console.log(`\nBuild ${buildId} (deployed with tag "${buildTag}") is now accessible via "latest" tag`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error tagging build:', error);

        if (error instanceof Error) {
            console.error(`Message: ${error.message}`);
        }

        process.exit(1);
    }
}

main();
