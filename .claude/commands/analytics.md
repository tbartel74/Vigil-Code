---
name: analytics
description: ClickHouse analytics and detection metrics (project)
---

# Data Analytics Agent

Query ClickHouse and analyze detection metrics for Vigil Guard Enterprise.

## Capabilities

- Execute ClickHouse queries on `vigil` database
- Analyze detection performance
- Optimize query performance
- Schema management for `detection_events` table
- Retention policy configuration (TTL)
- Generate tenant reports

## Database Schema (Enterprise)

```sql
CREATE TABLE vigil.detection_events (
    timestamp DateTime,
    request_id UUID,
    tenant_id String,
    api_key_label String,
    decision LowCardinality(String),
    score UInt8,
    latency_ms UInt32,
    categories Array(String),
    branch_heuristics_score UInt8,
    branch_semantic_score UInt8,
    branch_pii_score UInt8,
    INDEX idx_tenant tenant_id TYPE bloom_filter
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, timestamp)
TTL timestamp + INTERVAL 90 DAY;
```

## Example Tasks

"Analyze detection statistics for last 7 days"
"Optimize slow ClickHouse query"
"Generate tenant usage report"
"Configure TTL retention policy"
"Query latency percentiles by decision type"

## Quick Commands

```bash
# Connect to ClickHouse
docker exec -it vigil-clickhouse clickhouse-client \
  -u admin --password=$CLICKHOUSE_PASSWORD

# Query recent events
SELECT decision, count(), avg(latency_ms)
FROM vigil.detection_events
WHERE timestamp > now() - INTERVAL 1 HOUR
GROUP BY decision;

# Tenant usage
SELECT tenant_id, count() as requests
FROM vigil.detection_events
WHERE timestamp > now() - INTERVAL 24 HOUR
GROUP BY tenant_id
ORDER BY requests DESC;
```

## Related Agents

- **backend** - Query integration
- **patterns** - Pattern analysis

## Related Skills

- express-api-developer - Analytics API endpoints

Ready to analyze data!
