#!/usr/bin/env tsx
/**
 * Get Latest Build ID Script
 *
 * This script retrieves the most recent Actor build ID.
 * Used in CI/CD after `apify push` to reliably get the build ID.
 *
 * Usage:
 *   tsx scripts/get-build-id-by-tag.ts
 */

import { ApifyClient } from 'apify-client';

async function main() {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
        console.error('❌ Error: APIFY_TOKEN environment variable is required');
        process.exit(1);
    }

    const actorName = process.env.ACTOR_NAME || 'thehub-jobs-scraper';

    console.log(`\n🔍 Finding latest build ID\n`);
    console.log(`Actor: ${actorName}`);

    const client = new ApifyClient({ token });

    try {
        const currentUser = await client.user('me').get();
        if (!currentUser) {
            console.error('❌ Error: Could not get current user');
            process.exit(1);
        }

        const actorId = `${currentUser.username}/${actorName}`;
        console.log(`Actor ID: ${actorId}\n`);

        const { items: builds } = await client.actor(actorId).builds().list({
            limit: 10,
            desc: true,
        });

        if (!builds || builds.length === 0) {
            console.error('❌ Error: No builds found for this Actor');
            process.exit(1);
        }

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        const recentBuild = builds.find((b) => {
            const buildStartTime = new Date(b.startedAt);
            return buildStartTime >= fiveMinutesAgo && b.status === 'SUCCEEDED';
        });

        if (!recentBuild) {
            const latestBuild = builds[0];
            console.log(`⚠️  Warning: No build found in the last 5 minutes. Using latest build instead.`);
            console.log(`\n✅ Latest build:`);
            console.log(`   Build Number: ${latestBuild.buildNumber}`);
            console.log(`   Build ID: ${latestBuild.id}`);
            console.log(`   Status: ${latestBuild.status}`);
            console.log(`   Started: ${latestBuild.startedAt}`);
            console.log(`\n${latestBuild.id}`);
            process.exit(0);
        }

        console.log(`✅ Found recent build:`);
        console.log(`   Build Number: ${recentBuild.buildNumber}`);
        console.log(`   Build ID: ${recentBuild.id}`);
        console.log(`   Status: ${recentBuild.status}`);
        console.log(`   Started: ${recentBuild.startedAt}`);
        console.log(`\n${recentBuild.id}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error finding build:', error);

        if (error instanceof Error) {
            console.error(`Message: ${error.message}`);
        }

        process.exit(1);
    }
}

main();
