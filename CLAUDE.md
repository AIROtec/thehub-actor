# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Apify Actor built with TypeScript and Crawlee (CheerioCrawler) for scraping job listings from thehub.io, the Nordic startup job board. It uses a combination of REST API calls and SSR data extraction.

## Commands

```bash
# Local development
npm run start:dev              # Run Actor locally with tsx (development)
npm run start:prod             # Run compiled Actor (production)

# Testing with limited pages (E2E workflow testing)
MAX_PAGES_TEST=3 npm run start:dev    # Override max pages for quick testing
MAX_PAGES_TEST=10 npm run start:dev   # Test with more pages

# Testing with a single job
JOB_URL="https://thehub.io/jobs/abc123" npm run start:dev

# Build and quality
npm run build                  # Compile TypeScript to dist/
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint issues automatically
npm run format                 # Format code with Prettier
npm run format:check           # Check code formatting

# Deployment
apify login                    # Authenticate with Apify
apify push                     # Deploy Actor to Apify platform
```

## Architecture

### Data Flow

1. **API Fetching**: Fetch job listings from `https://thehub.io/api/v2/jobsandfeatured` (paginated, 15/page)
2. **Job Queue**: Enqueue individual job detail pages for each job ID
3. **SSR Extraction**: Extract full job data from `window.__NUXT__.state.jobs.job` in HTML
4. **Output**: Push combined data to Apify Dataset

### File Structure

- **src/main.ts** - Entry point. Reads input, fetches job listings from API, configures CheerioCrawler
- **src/routes.ts** - Request handlers for job-detail pages
- **src/api.ts** - thehub.io API functions (pagination, fetching)
- **src/nuxtExtractor.ts** - Extracts `__NUXT__` data from HTML using eval
- **src/types.ts** - TypeScript interfaces for all data structures

### Input/Output Configuration

- **.actor/actor.json** - Actor metadata and configuration
- **.actor/input_schema.json** - Input parameters (countries, jobUrl, maxRequestsPerCrawl)
- **.actor/output_schema.json** - Output structure specification
- **.actor/dataset_schema.json** - Dataset display configuration

## Key Dependencies

- **apify** - Apify SDK for platform integration
- **crawlee** - Web scraping framework (CheerioCrawler)
- **cheerio** - HTML parsing for **NUXT** extraction
- **husky** - Git hooks (pre-commit runs lint/format)

## Important Patterns

### ESM Module System

Uses ES modules. Always use `.js` extensions in imports:

```typescript
import { router } from './routes.js'; // Correct
```

### **NUXT** Extraction

thehub.io embeds job data as an IIFE in the HTML:

```html
<script>
    window.__NUXT__=(function(a,b,c...){return {...}}("val1","val2",...))
</script>
```

The extractor uses `eval()` to execute this IIFE and extract the job data:

```typescript
const nuxtData = eval(nuxtCode) as NuxtState;
const job = nuxtData.state.jobs.job;
```

### Country Codes

Supported country codes: `FI` (Finland), `SE` (Sweden), `DK` (Denmark), `NO` (Norway), `IS` (Iceland), `EU` (All European)

## Testing Environment Variables

**MAX_PAGES_TEST** - Quick E2E workflow testing:

```bash
MAX_PAGES_TEST=3 npm run start:dev
```

**JOB_URL** - Test scraping a single job:

```bash
JOB_URL="https://thehub.io/jobs/abc123" npm run start:dev
```

## Storage Locations

Local development storage:

- `storage/datasets/` - Scraped job data output
- `storage/key_value_stores/default/` - Input and other records

## API Limitations

- Fixed page size: 15 jobs per page (cannot be changed)
- No individual job API - must scrape HTML for full descriptions
- Rate limiting: unknown, recommend delays between requests
- `countryCode=REMOTE` returns empty - use `isRemote=true` filter instead

## Free Tier Behavior

When running on Apify free tier (`userIsPaying=false`), the actor limits to 50 items max to prevent overuse.

## Safety and Permissions

### Allowed without asking

- Read/write to Apify storage
- Run locally with npm scripts
- Fetch from thehub.io API and website

### Ask user first

- npm package installations
- `apify push` (deployment to cloud)
- Dockerfile changes
