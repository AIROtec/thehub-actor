# thehub.io Jobs Scraper

Scrape job listings from [thehub.io](https://thehub.io), the leading Nordic startup job board. Extract comprehensive job data including company details, salary information, location, and full job descriptions.

## What data can you get?

For each job listing, the scraper extracts:

- **Job details**: Title, description (full HTML), salary, salary range (min/max when available), equity, role type
- **Company info**: Name, website, employee count, founding year, company description, logo
- **Location**: Country, city, full address, remote work status
- **Metadata**: Publication date, expiration date, view counts, job position types

## Input Parameters

| Parameter             | Type    | Description                                                                                                                                                                                |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `jobUrl`              | string  | URL of a single job to scrape (e.g., `https://thehub.io/jobs/abc123`). When provided, only this job will be scraped.                                                                       |
| `regions`             | array   | Regions to scrape jobs from: `FI` (Finland), `SE` (Sweden), `DK` (Denmark), `NO` (Norway), `IS` (Iceland), `EU` (Other Europe), `REMOTE` (Remote only). Leave empty to scrape all regions. |
| `maxRequestsPerCrawl` | integer | Maximum number of jobs to scrape. Set to `0` for unlimited. Default: `0`.                                                                                                                  |

### Example Input

```json
{
    "regions": ["FI", "SE"],
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
    "jobPositionTypes": ["Full-time"],
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

The `jobPositionTypes` array contains human-readable labels:

- Full-time
- Part-time
- Internship
- Freelance
- Cofounder
- Student
- Advisory board

## Free Tier Limitation

When running on the Apify free tier, the scraper is limited to **50 jobs maximum** to prevent excessive resource usage. Upgrade to a paid plan for unlimited scraping.

## Use Cases

- **Job aggregation**: Build a Nordic startup job board
- **Market research**: Analyze hiring trends in Nordic tech
- **Competitive analysis**: Track competitor hiring activity
- **Talent sourcing**: Find companies hiring for specific roles
- **Data analysis**: Study salary ranges, remote work trends, and company growth

## Legal & Compliance

This Actor scrapes publicly available job listings from thehub.io. Please review thehub.io's terms of service before use and ensure compliance with applicable data protection regulations.
