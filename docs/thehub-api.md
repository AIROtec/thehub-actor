# TheHub.io Jobs API Documentation

## Overview

TheHub.io provides a REST API for fetching job listings. **No web scraping is required** - you can fetch jobs directly via HTTP requests.

## Base URL

```
https://thehub.io/api/v2
```

---

## Endpoints

### 1. List Jobs

```
GET /jobsandfeatured
```

Returns paginated job listings with optional filters.

#### Query Parameters

| Parameter            | Type    | Default       | Description                                                  |
| -------------------- | ------- | ------------- | ------------------------------------------------------------ |
| `page`               | integer | `1`           | Page number (1-indexed)                                      |
| `countryCode`        | string  | -             | Country filter: `FI`, `SE`, `DK`, `NO`, `IS`, `REMOTE`, `EU` |
| `sorting`            | string  | `mostPopular` | Sort order: `mostPopular`, `newest`                          |
| `includeSuggestions` | boolean | `false`       | Include filter facets in response                            |
| `jobRoles`           | string  | -             | Filter by role (e.g., `engineer`, `sales`, `marketing`)      |
| `jobPositionTypes`   | string  | -             | Filter by type ID (e.g., `5b8e46b3853f039706b6ea70`)         |
| `isRemote`           | boolean | -             | Filter remote jobs only                                      |
| `isPaid`             | boolean | -             | Filter paid positions only                                   |
| `locality`           | string  | -             | City filter (limited data availability)                      |
| `query`              | string  | -             | Search keyword                                               |

#### Pagination

- **Fixed page size**: 15 items per page (cannot be changed via `limit` or `pageSize`)
- Response includes: `total`, `limit`, `page`, `pages`

#### Example Request

```bash
curl "https://thehub.io/api/v2/jobsandfeatured?countryCode=FI&page=1&sorting=mostPopular&includeSuggestions=true"
```

#### Response Structure

```json
{
    "jobs": {
        "total": 54,
        "limit": 15,
        "page": 1,
        "pages": 4,
        "suggestions": {
            "jobPositionTypes": { "5b8e46b3853f039706b6ea70": 51 },
            "jobRoles": { "sales": 12, "engineer": 8, "marketing": 7 },
            "remote": 91,
            "paid": 52
        },
        "docs": [
            {
                "id": "6912f1cbec344369a23f416d",
                "key": "no-title-26452",
                "title": "Data Engineer",
                "location": {
                    "country": "Finland",
                    "locality": "Helsinki",
                    "address": "Helsinki, Finland"
                },
                "isRemote": false,
                "jobPositionTypes": ["5b8e46b3853f039706b6ea70"],
                "isFeatured": false,
                "views": { "week": 615, "total": 1332 },
                "company": {
                    "id": "589493810b41276a2a466f50",
                    "key": "singa-1",
                    "name": "Singa",
                    "website": "https://singa.com",
                    "numberOfEmployees": "51-100",
                    "founded": "2015",
                    "logoImage": {
                        "path": "/files/s3/20190917140949-xxx.jpg"
                    }
                },
                "saved": false
            }
        ]
    },
    "featuredJobs": {
        "total": 2,
        "docs": [
            /* featured job objects */
        ]
    }
}
```

---

### 2. Get Related Jobs

```
GET /jobs/{jobId}/related
```

Returns related job listings for a specific job. May return empty array if no related jobs exist.

---

### 3. Individual Job Details (SSR Only)

**No direct API endpoint exists** for individual job details. Full job data is embedded in the HTML via Nuxt.js SSR.

#### Access Method

Fetch the job page HTML and extract `window.__NUXT__.state.jobs.job`:

```
GET https://thehub.io/jobs/{jobId}
```

#### Full Job Object Fields

```json
{
  "id": "68d334cb65d0110b51d8627a",
  "key": "backend-software-engineer-internship",
  "title": "Backend Software Engineer, Internship",
  "description": "<h3>Full HTML description...</h3>",
  "descriptionLength": 6227,

  "salary": "unpaid",
  "equity": "undisclosed",
  "status": "ACTIVE",
  "jobRole": "backenddeveloper",
  "jobPositionTypes": ["5b8e46b3853f039706b6ea73"],
  "countryCode": "EU",

  "location": {
    "country": "Lithuania",
    "locality": "Vilnius",
    "address": "Vilnius, Vilnius City Municipality, Lithuania"
  },

  "isRemote": false,
  "isFeatured": false,
  "scraped": true,
  "showVouchWidget": false,

  "link": "https://career.relesys.ai/jobs/6465971",
  "expirationDate": "2026-05-26",

  "createdAt": "2025-09-24T00:01:15.760Z",
  "approvedAt": "2025-09-24T06:38:29.890Z",
  "publishedAt": "2025-09-24T06:38:30.027Z",

  "views": {
    "week": 448,
    "total": 5628
  },

  "socialImageUrl": "https://thehub-io.imgix.net/jobs/{jobId}/social.jpeg",
  "share": { "crop": null, "image": null },

  "questions": [],
  "criterias": [],

  "companyCountries": {
    "dk": {
      "status": "ACTIVE",
      "registrationNumber": "36432772",
      "location": {
        "address": "Orient Pl. 1, 2150 København, Denmark",
        "locality": "København",
        "country": "Denmark"
      },
      "geoLocation": {
        "center": { "type": "Point", "coordinates": [12.596, 55.711] }
      }
    },
    "se": { "status": "ACTIVE", "location": {...} },
    "fi": { "status": "DISABLED" },
    "no": { "status": "DISABLED" }
  },

  "company": {
    "id": "56b8b62654f298f74317ed60",
    "key": "relesys",
    "name": "Relesys",
    "website": "http://relesys.net/",
    "numberOfEmployees": "51-100",
    "founded": "2014",
    "video": "",
    "whatWeDo": "Company description... (1297 chars)",
    "perks": ["565c5794c37b3db6484b4d33", "..."],
    "logoImage": {
      "path": "/files/s3/20250129172452-xxx.png",
      "filetype": "image/png",
      "size": 58486
    },
    "galleryImages": [{ "path": "/files/s3/..." }]
  }
}
```

---

## Country Codes

| Code      | Country       | Sample Job Count                        |
| --------- | ------------- | --------------------------------------- |
| `FI`      | Finland       | ~54                                     |
| `SE`      | Sweden        | ~172                                    |
| `DK`      | Denmark       | ~408                                    |
| `NO`      | Norway        | ~90                                     |
| `IS`      | Iceland       | ~1                                      |
| `REMOTE`  | Remote only   | Returns 0 (use `isRemote=true` instead) |
| `EU`      | All European  | ~91                                     |
| _(empty)_ | All countries | ~91                                     |

---

## Job Position Type IDs

| ID                         | Type       | Count |
| -------------------------- | ---------- | ----- |
| `5b8e46b3853f039706b6ea70` | Full-time  | ~56   |
| `5b8e46b3853f039706b6ea71` | Part-time  | ~20   |
| `5b8e46b3853f039706b6ea73` | Internship | ~19   |
| `5b8e46b3853f039706b6ea75` | Freelance  | ~8    |
| `5b8e46b3853f039706b6ea74` | Contract   | ~6    |
| `5b8e46b3853f039706b6ea72` | Cofounder  | ~3    |

---

## Job Roles

Available `jobRoles` values:

- `sales` (24), `marketing` (12), `engineer` (8), `fullstackdeveloper` (6)
- `datascience` (5), `design` (5), `businessdevelopment` (4), `backenddeveloper` (4)
- `other` (5), `uxuidesigner` (3), `frontenddeveloper` (3), `mobiledevelopment` (2)
- `devops` (2), `qualityassurance` (2), `humanresources` (2), `customersuccess` (1)
- `cxo` (1), `operations` (1), `projectmanagement` (1), `analyst` (1), `finance` (1)

---

## Image URLs

Logo and gallery images use relative paths. Construct full URLs:

```
https://thehub-io.imgix.net{path}?fit=crop&w=300&h=300&auto=format&q=60
```

Example:

```
https://thehub-io.imgix.net/files/s3/20190917140949-xxx.jpg?fit=crop&w=300&h=300&auto=format&q=60
```

---

## Scraping Strategy Recommendation

### Option A: API-Only (Recommended for job listings)

Use `CheerioCrawler` or plain HTTP requests to fetch from `/api/v2/jobsandfeatured`:

```typescript
// Fetch all jobs across pages
const jobs = [];
let page = 1;
while (true) {
    const res = await fetch(`https://thehub.io/api/v2/jobsandfeatured?page=${page}&countryCode=FI`);
    const data = await res.json();
    jobs.push(...data.jobs.docs);
    if (page >= data.jobs.pages) break;
    page++;
}
```

### Option B: SSR Extraction (Required for full job descriptions)

For full job details including descriptions, you must extract `__NUXT__` data from the HTML. The data is embedded as an **IIFE (Immediately Invoked Function Expression)**, not raw JSON.

#### HTML Format

The script tag has no `id` or `type` attribute and looks like:

```html
<script>
    window.__NUXT__=(function(a,b,c,d,e,f,g,...){return {layout:"default",data:[{job:{...}}],state:{jobs:{job:{...}}}}}("active","...",...))
</script>
```

**Important:** This is executable JavaScript (~30KB), not JSON. It uses parameter substitution for compression (repeated strings become single-letter variables).

#### Extraction Methods

**Method 1: Playwright/Browser (Recommended)**

Execute JavaScript in the page context to get the already-evaluated object:

```typescript
// Using Playwright
const page = await browser.newPage();
await page.goto(`https://thehub.io/jobs/${jobId}`);
const job = await page.evaluate(() => window.__NUXT__?.state?.jobs?.job);
```

**Method 2: Cheerio + vm (Node.js sandbox)**

Extract and execute the IIFE in a sandboxed environment:

```typescript
import { VM } from 'vm2';
import * as cheerio from 'cheerio';

const html = await fetch(`https://thehub.io/jobs/${jobId}`).then((r) => r.text());
const $ = cheerio.load(html);

// Find the script containing __NUXT__
const nuxtScript = $('script')
    .filter((i, el) => $(el).html()?.includes('window.__NUXT__'))
    .html();

if (nuxtScript) {
    // Execute in sandbox
    const vm = new VM({ timeout: 1000 });
    const nuxtData = vm.run(nuxtScript.replace('window.__NUXT__=', ''));
    const job = nuxtData.state.jobs.job;
}
```

**Method 3: Cheerio + eval (Simpler but less safe)**

```typescript
const html = await fetch(`https://thehub.io/jobs/${jobId}`).then((r) => r.text());
const $ = cheerio.load(html);
const nuxtScript = $('script')
    .filter((i, el) => $(el).html()?.includes('__NUXT__'))
    .html();

// WARNING: eval can execute arbitrary code - only use with trusted sources
const nuxtData = eval(nuxtScript.replace('window.__NUXT__=', ''));
const job = nuxtData.state.jobs.job;
```

#### Data Location

The job object is located at `window.__NUXT__.state.jobs.job` (not in `data` array).

### Limitations

1. **Page size is fixed at 15** - cannot be increased
2. **No individual job API** - must scrape HTML for full descriptions
3. **Rate limiting** - unknown, recommend delays between requests
4. **`countryCode=REMOTE`** returns empty results - use `isRemote=true` filter instead
