# Data Analytics Agent

## Overview

The Data Analytics Agent manages ClickHouse database operations, Grafana dashboard creation, data retention policies, and analytical queries for Vigil Guard's monitoring and reporting systems.

**Version:** 1.0.0
**Based on:** clickhouse-grafana-monitoring
**Status:** Active

## Core Responsibilities

### 1. ClickHouse Management
- Schema design and optimization
- Query performance tuning
- Data retention policies
- Partition management

### 2. Grafana Dashboards
- Dashboard creation and configuration
- Panel design and queries
- Alert rule configuration
- Visualization best practices

### 3. Analytics Queries
- Detection statistics
- Threat analysis
- Performance metrics
- Custom reports

### 4. Data Retention
- TTL policy configuration
- Partition lifecycle management
- Storage optimization
- Archival strategies

### 5. Performance Monitoring
- Query performance analysis
- Resource usage tracking
- Optimization recommendations
- Capacity planning

## Tech Stack

- **ClickHouse:** Latest version
- **Grafana:** 11.3.1
- **SQL:** ClickHouse dialect
- **Map type:** For score_breakdown
- **MergeTree:** Table engine

## Supported Tasks

### Task Identifiers
- `query_detection_logs` - Query event logs
- `create_dashboard` - Create Grafana dashboard
- `optimize_schema` - Optimize table schema
- `configure_retention` - Set retention policies
- `analyze_threats` - Threat analysis queries
- `check_performance` - Performance metrics
- `query_error_logs` - Error analysis
- `create_alert` - Setup monitoring alerts

## Database Schema

### Main Tables

```sql
-- Events processed table
CREATE TABLE n8n_logs.events_processed (
  timestamp DateTime64(3),
  sessionId String,
  pipeline_version String,
  original_input String,
  final_status String,
  threat_score UInt8,
  score_breakdown Map(String, Float32),
  sanitizer_json String,
  pii_sanitized UInt8,
  result String,
  processing_time_ms UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, sessionId)
TTL timestamp + INTERVAL 90 DAY;

-- Raw events table
CREATE TABLE n8n_logs.events_raw (
  timestamp DateTime64(3),
  sessionId String,
  chat_input String,
  metadata String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY timestamp
TTL timestamp + INTERVAL 30 DAY;
```

## Common Queries

### Detection Statistics

```sql
-- Daily detection summary
SELECT
  toDate(timestamp) as date,
  count() as total_events,
  countIf(final_status = 'BLOCKED') as blocked,
  countIf(final_status = 'ALLOWED') as allowed,
  countIf(final_status LIKE 'SANITIZE%') as sanitized,
  round(avg(threat_score), 2) as avg_threat_score
FROM n8n_logs.events_processed
WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY date
ORDER BY date DESC;

-- Category breakdown using Map type
SELECT
  arrayJoin(mapKeys(score_breakdown)) as category,
  count() as detections,
  round(avg(mapValues(score_breakdown)[1]), 2) as avg_score
FROM n8n_logs.events_processed
WHERE timestamp > now() - INTERVAL 24 HOUR
  AND score_breakdown['category'] IS NOT NULL
GROUP BY category
ORDER BY detections DESC
LIMIT 20;
```

### PII Detection Analysis

```sql
-- PII detection rate
SELECT
  toDate(timestamp) as date,
  countIf(pii_sanitized = 1) as pii_detected,
  count() as total,
  round(pii_detected * 100.0 / total, 2) as pii_rate
FROM n8n_logs.events_processed
WHERE timestamp > now() - INTERVAL 7 DAY
GROUP BY date
ORDER BY date DESC;

-- PII entity types
SELECT
  JSONExtractString(sanitizer_json, 'pii', 'detection_method') as method,
  JSONExtractString(sanitizer_json, 'pii', 'language_stats', 'detected_language') as language,
  count() as occurrences
FROM n8n_logs.events_processed
WHERE pii_sanitized = 1
  AND timestamp > now() - INTERVAL 24 HOUR
GROUP BY method, language
ORDER BY occurrences DESC;
```

### Performance Metrics

```sql
-- Processing time analysis
SELECT
  quantile(0.50)(processing_time_ms) as p50,
  quantile(0.95)(processing_time_ms) as p95,
  quantile(0.99)(processing_time_ms) as p99,
  max(processing_time_ms) as max_ms,
  avg(processing_time_ms) as avg_ms
FROM n8n_logs.events_processed
WHERE timestamp > now() - INTERVAL 1 HOUR;

-- Hourly throughput
SELECT
  toStartOfHour(timestamp) as hour,
  count() as events,
  round(count() / 3600.0, 2) as events_per_second
FROM n8n_logs.events_processed
WHERE timestamp > now() - INTERVAL 24 HOUR
GROUP BY hour
ORDER BY hour DESC;
```

## Grafana Dashboard Configuration

### Dashboard JSON Template

```json
{
  "dashboard": {
    "title": "Vigil Guard Detection Analytics",
    "panels": [
      {
        "title": "Detection Rate",
        "targets": [{
          "rawSql": "SELECT $__timeGroup(timestamp, '1h') as time, countIf(final_status = 'BLOCKED') * 100.0 / count() as detection_rate FROM n8n_logs.events_processed WHERE $__timeFilter(timestamp) GROUP BY time ORDER BY time"
        }],
        "type": "timeseries"
      },
      {
        "title": "Threat Categories",
        "targets": [{
          "rawSql": "SELECT arrayJoin(mapKeys(score_breakdown)) as category, count() as value FROM n8n_logs.events_processed WHERE $__timeFilter(timestamp) GROUP BY category"
        }],
        "type": "piechart"
      }
    ],
    "refresh": "30s",
    "time": {
      "from": "now-24h",
      "to": "now"
    }
  }
}
```

### Alert Rules

```yaml
# High threat volume alert
- alert: HighThreatVolume
  expr: |
    SELECT count()
    FROM n8n_logs.events_processed
    WHERE timestamp > now() - INTERVAL 5 MINUTE
      AND final_status = 'BLOCKED'
  threshold: 100
  message: "High volume of blocked requests: {{ value }}"

# PII detection spike
- alert: PIIDetectionSpike
  expr: |
    SELECT countIf(pii_sanitized = 1)
    FROM n8n_logs.events_processed
    WHERE timestamp > now() - INTERVAL 10 MINUTE
  threshold: 50
  message: "Unusual PII detection activity"
```

## Data Retention Configuration

### TTL Policies

```sql
-- Set retention for processed events (90 days)
ALTER TABLE n8n_logs.events_processed
MODIFY TTL timestamp + INTERVAL 90 DAY;

-- Set retention for raw events (30 days)
ALTER TABLE n8n_logs.events_raw
MODIFY TTL timestamp + INTERVAL 30 DAY;

-- Delete old partitions manually
ALTER TABLE n8n_logs.events_processed
DROP PARTITION '202301';
```

### Partition Management

```sql
-- View partitions
SELECT
  partition,
  name,
  rows,
  formatReadableSize(bytes_on_disk) as size
FROM system.parts
WHERE database = 'n8n_logs'
  AND table = 'events_processed'
  AND active
ORDER BY partition DESC;

-- Optimize partition
OPTIMIZE TABLE n8n_logs.events_processed
PARTITION '202411'
FINAL;
```

## Performance Optimization

### Query Optimization Tips

```sql
-- Use proper indexes
ALTER TABLE n8n_logs.events_processed
ADD INDEX idx_status final_status TYPE set(100) GRANULARITY 4;

-- Use PREWHERE for filtering
SELECT *
FROM n8n_logs.events_processed
PREWHERE timestamp > now() - INTERVAL 1 DAY
WHERE final_status = 'BLOCKED';

-- Avoid SELECT *
-- ❌ Wrong
SELECT * FROM events_processed;

-- ✅ Correct
SELECT timestamp, final_status, threat_score
FROM events_processed;
```

### Map Type Optimization

```sql
-- Efficient Map queries
SELECT
  category,
  sum(score) as total_score
FROM (
  SELECT
    mapKeys(score_breakdown) as keys,
    mapValues(score_breakdown) as values
  FROM events_processed
)
ARRAY JOIN keys as category, values as score
GROUP BY category;
```

## Troubleshooting

### Common Issues

**Slow Queries**
```sql
-- Check query performance
EXPLAIN PLAN
SELECT ... FROM events_processed ...;

-- View running queries
SELECT query_id, elapsed, query
FROM system.processes
WHERE elapsed > 5;
```

**Storage Issues**
```sql
-- Check disk usage
SELECT
  database,
  table,
  formatReadableSize(sum(bytes_on_disk)) as size
FROM system.parts
WHERE active
GROUP BY database, table
ORDER BY sum(bytes_on_disk) DESC;
```

## Integration Points

### With Other Agents
- **backend-api-agent**: Provides query endpoints
- **workflow-business-logic-agent**: Detection metrics
- **security-compliance-agent**: Security audit data

### External Systems
- n8n workflow logging
- Grafana visualization
- Web UI analytics display

## Quality Metrics

### Performance Targets
- Query response: <100ms (p95)
- Dashboard load: <3 seconds
- Data ingestion: >1000 events/sec
- Storage efficiency: <1KB per event

### Data Quality
- Schema consistency: 100%
- Data completeness: >99%
- Query accuracy: 100%
- Retention compliance: 100%

## Best Practices

1. **Use appropriate data types** - Optimize storage
2. **Partition by time** - Improve query performance
3. **Set proper TTL** - Manage storage costs
4. **Monitor query performance** - Identify bottlenecks
5. **Use materialized views** - For frequent queries
6. **Regular maintenance** - Optimize tables
7. **Document queries** - Maintain query library

## File Locations

```
services/monitoring/
├── clickhouse/
│   ├── init/
│   │   └── schema.sql
│   └── config/
│       └── config.xml
├── grafana/
│   ├── provisioning/
│   │   ├── dashboards/
│   │   └── datasources/
│   └── dashboards/
│       └── vigil-guard.json
└── scripts/
    └── init-clickhouse.sh
```

---

**Note:** This agent ensures efficient data analytics and monitoring capabilities while maintaining optimal performance and storage efficiency.