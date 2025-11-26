import { ApifyClient } from 'apify-client';

export interface ActorRunResult {
    id: string;
    status: string;
    startedAt: Date;
    finishedAt: Date;
    stats: {
        durationMillis: number;
        memoryUsageBytes: number;
        requestsFinished: number;
        requestsFailed: number;
    };
    defaultDatasetId: string;
}

export interface ActorRunOptions {
    regions?: string[];
    jobUrl?: string;
    maxRequestsPerCrawl?: number;
}

export class ApifyClientWrapper {
    private client: ApifyClient;
    private actorId: string;

    constructor(token: string, actorId = 'the-hub-jobs-scraper') {
        this.client = new ApifyClient({ token });
        this.actorId = actorId;
    }

    async callActor(input: ActorRunOptions, timeoutSecs = 600): Promise<ActorRunResult> {
        console.log(`Starting Actor ${this.actorId} with input:`, input);

        const run = await this.client.actor(this.actorId).call(input, {
            waitSecs: timeoutSecs,
        });

        if (run.status !== 'SUCCEEDED') {
            throw new Error(`Actor run failed with status: ${run.status}`);
        }

        console.log(`Actor run completed: ${run.id}`);

        const stats = run.stats as any;
        return {
            id: run.id,
            status: run.status,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt,
            stats: {
                durationMillis: new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime(),
                memoryUsageBytes: stats?.memAvgBytes || 0,
                requestsFinished: stats?.requestsFinished || 0,
                requestsFailed: stats?.requestsFailed || 0,
            },
            defaultDatasetId: run.defaultDatasetId,
        };
    }

    async getDatasetItems<T = unknown>(datasetId: string): Promise<T[]> {
        console.log(`Fetching dataset items from: ${datasetId}`);

        const dataset = await this.client.dataset(datasetId).listItems();

        console.log(`Retrieved ${dataset.items.length} items from dataset`);

        return dataset.items as T[];
    }

    async getRunLog(runId: string): Promise<string> {
        const log = await this.client.log(runId).get();
        return log || '';
    }
}

export function createApifyClient(): ApifyClientWrapper {
    const token = process.env.APIFY_TOKEN;

    if (!token) {
        throw new Error(
            'APIFY_TOKEN environment variable is not set. ' +
                'Please set it to run E2E tests against the Apify platform.',
        );
    }

    const actorId = process.env.APIFY_ACTOR_ID || 'the-hub-jobs-scraper';

    return new ApifyClientWrapper(token, actorId);
}
