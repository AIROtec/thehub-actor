# TheHub.io Jobs Scraper

Scrape job listings from [TheHub.io](https://thehub.io), the leading Nordic startup job board. Extract comprehensive job data including company details, salary information, location, and full job descriptions.

## What data can you get?

For each job listing, the scraper extracts:

- **Job details**: Title, description (full HTML), salary, salary range (min/max when available), equity, role type
- **Company info**: Name, website, employee count, founding year, company description, logo
- **Location**: Country, city, full address, remote work status
- **Metadata**: Publication date, expiration date, view counts, job position types

## Input Parameters

| Parameter             | Type    | Description                                                                                                                                                      |
| --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jobUrl`              | string  | URL of a single job to scrape (e.g., `https://thehub.io/jobs/abc123`). When provided, only this job will be scraped.                                             |
| `countries`           | array   | Countries to scrape jobs from: `FI` (Finland), `SE` (Sweden), `DK` (Denmark), `NO` (Norway), `IS` (Iceland), `EU` (All European). Default: all Nordic countries. |
| `maxRequestsPerCrawl` | integer | Maximum number of jobs to scrape. Set to `0` for unlimited. Default: `0`.                                                                                        |

### Example Input

```json
{
    "countries": ["FI", "SE"],
    "maxRequestsPerCrawl": 100
}
```

To scrape a single job:

```json
{
    "jobUrl": "https://thehub.io/jobs/6920fd58efed440a42c6670d"
}
```

## Output Format

Each job is saved as a JSON object in the dataset:

```json
{
    "id": "6920fd58efed440a42c6670d",
    "key": "software-engineer-full-stack-2",
    "url": "https://thehub.io/jobs/6920fd58efed440a42c6670d",
    "title": "Software Engineer (Full-Stack)",
    "description": "<p><strong>About us</strong>...</p>",
    "company": {
        "id": "60f669afaa932449ebfd1668",
        "key": "huuva",
        "name": "Huuva",
        "website": "http://huuva.io",
        "numberOfEmployees": "51-100",
        "founded": "2021",
        "whatWeDo": "Huuva brings the most loved city-center restaurants...",
        "logoUrl": "https://thehub-io.imgix.net/files/s3/..."
    },
    "location": {
        "address": "Helsinki, Finland",
        "locality": "Helsinki",
        "country": "Finland"
    },
    "isRemote": false,
    "salary": "range",
    "salaryRange": {
        "min": 5500,
        "max": 6500
    },
    "equity": "undisclosed",
    "jobRole": "fullstackdeveloper",
    "jobPositionTypes": ["5b8e46b3853f039706b6ea70"],
    "views": {
        "week": 537,
        "total": 537
    },
    "link": "https://huuva.teamtailor.com/jobs/6824558",
    "createdAt": "2025-11-22T00:01:28.410Z",
    "publishedAt": "2025-11-22T00:01:28.410Z",
    "expirationDate": "2026-05-26",
    "scrapedAt": "2025-11-26T14:08:43.574Z"
}
```

## Job Position Types

The `jobPositionTypes` array contains IDs that map to:

| ID                         | Type       |
| -------------------------- | ---------- |
| `5b8e46b3853f039706b6ea70` | Full-time  |
| `5b8e46b3853f039706b6ea71` | Part-time  |
| `5b8e46b3853f039706b6ea73` | Internship |
| `5b8e46b3853f039706b6ea75` | Freelance  |
| `5b8e46b3853f039706b6ea74` | Contract   |
| `5b8e46b3853f039706b6ea72` | Cofounder  |

## Typical Job Counts by Country

| Country           | Approximate Jobs |
| ----------------- | ---------------- |
| Denmark (DK)      | ~400             |
| Sweden (SE)       | ~170             |
| Norway (NO)       | ~90              |
| Finland (FI)      | ~55              |
| EU (all European) | ~90              |
| Iceland (IS)      | ~1               |

## Free Tier Limitation

When running on the Apify free tier, the scraper is limited to **50 jobs maximum** to prevent excessive resource usage. Upgrade to a paid plan for unlimited scraping.

## Performance

- **Speed**: ~30 jobs per minute with high concurrency
- **Memory**: 256 MB - 1024 MB

## Use Cases

- **Job aggregation**: Build a Nordic startup job board
- **Market research**: Analyze hiring trends in Nordic tech
- **Competitive analysis**: Track competitor hiring activity
- **Talent sourcing**: Find companies hiring for specific roles
- **Data analysis**: Study salary ranges, remote work trends, and company growth

## Legal & Compliance

This Actor scrapes publicly available job listings from TheHub.io. Please review TheHub.io's terms of service before use and ensure compliance with applicable data protection regulations.
