# QSR-ODI-Demo · Hearth Coffee Co.

End-to-end demonstration of **Fivetran's Open Data Infrastructure (ODI)** in a
quick-service-restaurant setting. Hearth Coffee Co. is a fictional national
QSR chain (4,812 locations, ~$11B annual revenue, specialty coffee + breakfast
+ grab-and-go). The data flows are real ODI patterns; the numbers are
synthetic.

ODI's pitch in one line: **storage, catalog, and compute are independently
swappable open standards** — Iceberg + Glue + (Snowflake | Trino | DuckDB | Spark).
No warehouse vendor in the path. AI agents read the lake directly.

## Audience

The demo is built for two C-suite roles:

- **Chief Digital Officer** — mobile app, loyalty, conversion, member 360.
- **Chief Restaurant Operations Officer** — store throughput, drive-thru
  speed, labor cost, peak-hour staffing, supplier risk.

## Quick demo (synthetic only)

No API keys, no AWS, no Fivetran. The snapshot JSONs are pre-built and
checked in under `hearth-app/frontend/public/data/`.

```bash
cd hearth-app/frontend
npm ci
npm run dev    # http://localhost:5173
```

## Data sources (14 connectors)

| Domain        | Sources                                              |
| ------------- | ---------------------------------------------------- |
| Point of sale | Toast POS, NCR Aloha, Square Terminal                |
| Digital       | Olo (order-ahead), Hearth App events (Snowplow)      |
| Delivery      | DoorDash Marketplace, Uber Eats, Grubhub             |
| Loyalty + CRM | Salesforce Marketing Cloud                           |
| Workforce     | Workday HCM, Kronos / UKG Time + Attendance          |
| Supply chain  | Coffee + Dairy ERP (Oracle)                          |
| Reviews       | Yelp, Google Reviews                                 |

Every connector here is labeled **Fivetran** in lineage because Fivetran is
the single ingest control plane. Sources land into Apache Iceberg on
`s3://hearth-odi-lake`. dbt builds bronze (168 tables), silver (72),
gold (28), and marts (14). Snowflake is the primary read engine; Trino,
DuckDB, and Spark read the same tables when the workload calls for it.

## Pages

- **Home** — KPI tiles, US locations cartogram, top 3 issues on the desk today.
- **Operations** — store throughput, drive-thru speed, labor cost, staffing agent.
- **Mobile + Loyalty** — funnel, payment mix, feature adoption, loyalty agent.
- **Menu** — top 20 SKUs, regional variations, green-bean sourcing, supply risk.
- **Architecture** — sources → Iceberg lake → engines + agents diagram.
- **Pipeline** — 14 connectors, 4 dbt layers, failure simulator.
- **Policy** — why QSR data is fragmented and how ODI bridges it.
- **About** — the canonical ODI Story block plus the Hearth-specific pitch.

## Tech stack

- React 19 + Vite + Tailwind v4 + TypeScript
- Static SPA on GitHub Pages, no backend
- All data is synthetic; site reads JSON from `/public/data/`
- Deployed via the `.github/workflows/deploy.yml` GitHub Action

## Disclaimer

Hearth Coffee Co. is fictional. No portion of this site represents real
Starbucks, Dunkin', Tim Hortons, or any other operator's metrics, and no
portion constitutes operational or investment advice.
