**Campaign recovery drill: the promotion export is green, but two destinations disagree**

Core data engineering; Databricks/PySpark, Delta CDF, Snowflake SQL, delivery reliability, and governance. This is a fictional incident inspired by the legacy → Databricks → Segment architecture you described. All data, identifiers and adapters are mock. Suggested timebox: 120 minutes.

Your manager's ticket: “The promotion job says SUCCESS. Segment and the legacy CRM disagree about customer offers, a withdrawn offer is still active, and several activations have no promotion-history row. Restore the agreed business state and produce evidence that retries, deployments and feedback messages cannot repeat this incident.”

The existing path is legacy authoring → Bronze/Silver validation → hgv_lab.gold.promo_assignment → one Structured Streaming foreachBatch callback → Segment adapter, legacy adapter, then Snowflake history. A second process copies current state into LAB_ANALYTICS.CDP.PROMO_STATUS. The source Gold decisions are already validated; the failure is in export and recovery. No model or MLflow component is needed for this activity.

The lab is pinned to Databricks Runtime 16.4 LTS with legacy Delta CDF enabled and UTC timestamps. Snowflake objects are standard tables. `sf` in faulty_job.py is an internal wrapper; the supplied adapters are a simulation, not actual Segment or legacy API definitions.

The download contains these files.

- `fixture.json`: full source records, replay captures, baseline, replacement-table snapshot, a legacy acknowledgement, and per-version archive manifests with actual SHA-256 values.
- `snowflake_fixture.sql`: executable Snowflake DDL and inserts for the isolated LAB_* namespaces. Re-running this fixture resets those named lab tables.
- `faulty_job.py`: the existing Databricks implementation to repair. Wrapper integrations are deliberately left for your implementation.
- `mock_destinations.py`: executable standard-library receiver simulator, including the two already-applied operations with uncertain client responses. It never makes network calls.

Run `python3 mock_destinations.py` to inspect the seeded receiver state. Import `MockDestinations` into your recovery tests. Keep the supplied receiver behavior unchanged.

Apply the following business contract.

The key is `(TENANT_ID, CUSTOMER_ID, CAMPAIGN_ID)`. `DECISION_SEQ` is an authoring-system integer that increases for that key. `ACTIVE` requires an offer; `WITHDRAWN` has no offer. Different offers/statuses for the same key and sequence constitute a conflict. A source timestamp can be old even when its decision sequence is new.

Every approved decision revision must have one durable promotion-history record before any new downstream attempt for that decision. The history is evidence of authorization, not proof of delivery. Preserve original source time and actual history-recording time separately; do not backdate recovered audit records.

Every intended revision in this fixture must eventually be accounted for at both destinations. Downstream effects are offer-state changes, not emails, payments or other irreversible actions. A physical delete only purges a row that was already WITHDRAWN; it does not authorize another decision or erase the withdrawal. A `WRITEBACK_ACK` is a legacy acknowledgement, not another business decision.

The existing source and sink objects are defined below.

Databricks: `hgv_lab.gold.promo_assignment` has tenant_id STRING, customer_id STRING, campaign_id STRING, decision_seq BIGINT, offer_id STRING, status STRING and source_updated_at TIMESTAMP. CDF supplies _change_type STRING, _commit_version BIGINT and _commit_timestamp TIMESTAMP. The captured archive adds source_table_id and event_id. `hgv_lab.audit.promo_cdf_archive` retains the complete original records and their manifests. `hgv_lab.bronze.legacy_ack` receives acknowledgement echoes.

The supplied Snowflake setup defines:

```sql
LAB_RAW.CDP.PROMO_CDF (
 CAPTURE_ID VARCHAR, EVENT_ID VARCHAR, SOURCE_TABLE_ID VARCHAR,
 COMMIT_VERSION NUMBER, COMMIT_TIMESTAMP TIMESTAMP_TZ, CHANGE_TYPE VARCHAR,
 TENANT_ID VARCHAR, CUSTOMER_ID VARCHAR, CAMPAIGN_ID VARCHAR,
 DECISION_SEQ NUMBER, OFFER_ID VARCHAR, STATUS VARCHAR,
 SOURCE_UPDATED_AT TIMESTAMP_TZ
);
LAB_CURATED.CDP.PROMO_CURRENT (
 TENANT_ID VARCHAR, CUSTOMER_ID VARCHAR, CAMPAIGN_ID VARCHAR,
 DECISION_SEQ NUMBER, OFFER_ID VARCHAR, STATUS VARCHAR,
 SOURCE_UPDATED_AT TIMESTAMP_TZ
);
LAB_OPS.CDP.PROMO_HISTORY (
 HISTORY_ID VARCHAR, TENANT_ID VARCHAR, CUSTOMER_ID VARCHAR,
 CAMPAIGN_ID VARCHAR, DECISION_SEQ NUMBER, OFFER_ID VARCHAR, STATUS VARCHAR,
 SOURCE_UPDATED_AT TIMESTAMP_TZ, RECORDED_AT TIMESTAMP_TZ
);
LAB_OPS.CDP.DELIVERY_ATTEMPT (
 OPERATION_ID VARCHAR, DESTINATION VARCHAR, TENANT_ID VARCHAR,
 CUSTOMER_ID VARCHAR, CAMPAIGN_ID VARCHAR, DECISION_SEQ NUMBER,
 OFFER_ID VARCHAR, STATUS VARCHAR, OBSERVED_RESULT VARCHAR
);
LAB_OPS.CDP.CONSUMER_CONTROL (
 CONSUMER_NAME VARCHAR, LAST_PROVEN_TABLE_ID VARCHAR, LAST_PROVEN_VERSION NUMBER,
 LAST_SEEN_VERSION NUMBER, LAST_BATCH_ID NUMBER
);
LAB_ANALYTICS.CDP.PROMO_STATUS (
 TENANT_ID VARCHAR, CUSTOMER_ID VARCHAR, CAMPAIGN_ID VARCHAR,
 DECISION_SEQ NUMBER, OFFER_ID VARCHAR, STATUS VARCHAR, RELEASE_ID VARCHAR
);
```

The history/current/control structures are the existing implementation, not an approved design. You may change them and add objects; provide migrations and ownership.

Use this fixture as the authoritative incident evidence.

The baseline is proven through source table `delta-G1`, version 700. Both destinations and Snowflake had the following four ACTIVE rows, with four history rows. The campaign is FALL26 throughout.

| Tenant | Customer | Sequence | Offer |
|---|---|---:|---|
| TEN-A | C100 | 7 | O10 |
| TEN-A | C200 | 4 | O20 |
| TEN-B | C100 | 2 | O30 |
| TEN-B | C300 | 8 | O40 |

The closed recovery range is original table `delta-G1`, versions 701–706 inclusive. Its complete CDF archive is:

| Event | Version | Change type | Tenant/customer | Seq | Offer | Status |
|---|---:|---|---|---:|---|---|
| R01 | 701 | update_preimage | TEN-A/C100 | 7 | O10 | ACTIVE |
| R02 | 701 | update_postimage | TEN-A/C100 | 8 | O11 | ACTIVE |
| R03 | 702 | update_preimage | TEN-A/C200 | 4 | O20 | ACTIVE |
| R04 | 702 | update_postimage | TEN-A/C200 | 5 | null | WITHDRAWN |
| R05 | 703 | update_preimage | TEN-B/C100 | 2 | O30 | ACTIVE |
| R06 | 703 | update_postimage | TEN-B/C100 | 3 | O31 | ACTIVE |
| R07 | 704 | update_preimage | TEN-B/C300 | 8 | O40 | ACTIVE |
| R08 | 704 | update_postimage | TEN-B/C300 | 9 | O41 | ACTIVE |
| R09 | 705 | delete | TEN-A/C200 | 5 | null | WITHDRAWN |
| R10 | 706 | insert | TEN-A/C400 | 1 | O50 | ACTIVE |

Raw capture also contains duplicate deliveries of R02 and R09: 12 physical captures, 10 distinct source events. Commit 704 arrived on September 26 at 08:40 UTC; R08's source update was September 23 at 08:40 UTC. All other exact timestamps are in fixture.json.

The source name now resolves to `delta-G2`, version 3 after a rebuild. Its current snapshot has the four active rows and no C200 row. The old table's earliest available live CDF version is 704. The independent archive retains all ten original events, including versions 701–703, with per-version counts `[2,2,2,2,1,1]`. Authoring is paused during recovery. The operations team has not approved continuity between G1 and G2.

The destination contracts and previously applied effects are as follows.

Both mock adapters accept exactly the six fields tenant_id, customer_id, campaign_id, decision_seq, offer_id and status.

```python
api.post(destination, operation_id, command)   # 202 or 429, possibly timeout
api.get(destination, operation_id)             # operation status and body
api.read_state(destination, tenant, customer, campaign)
api.set_fault(destination, operation_id, "timeout_after_apply")
api.set_fault(destination, operation_id, "rate_limit")
api.set_fault(destination, operation_id, "pending")
```

Destination names are SEGMENT_ADAPTER and LEGACY_ADAPTER. A 202 returns a receipt. GET reports PENDING, APPLIED, ALREADY_CURRENT, STALE_NOOP, RECEIVER_CONFLICT or NOT_ACCEPTED. The mock advances a non-faulted pending command when GET is called. `pending` remains pending until the test removes that fault.

Operation lookup is authoritative, immediately consistent and retained for 30 days. A definitive 429 or GET 404 means the operation was not accepted. Reusing an operation ID with the same body refers to the same operation; a changed body returns 409. Lower sequences cannot change destination state. Equal sequences with different content report conflict. Equal sequences with equal content have no further business effect. The combined production limit is 600 requests per second, including status queries; 429 carries Retry-After. The local simulator does not impose wall-clock rate limits.

Snowflake currently records these observations:

| Operation | Destination | Decision | Observed result |
|---|---|---|---|
| old-S-A100-8 | SEGMENT_ADAPTER | TEN-A/C100/FALL26 seq 8, O11 | HTTP_202 |
| old-L-A100-8 | LEGACY_ADAPTER | TEN-A/C100/FALL26 seq 8, O11 | TIMEOUT |

Both receivers actually applied those commands. Snowflake history still has only the baseline four rows. These two prior authorization-history violations are established incident facts and must remain visible. The simulator starts with two new applications already counted. The legacy receiver emits WRITEBACK_ACK messages with origin_operation_id; one seeded acknowledgement is supplied in fixture.json.

The execution log contains these observations.

```text
08:45 legacy consumer resumes after a prolonged outage
08:46 startingVersion=701 fails: requested history unavailable
08:47 deployment removes startingVersion and changes checkpoint directory
08:48 source lookup reports table_id=delta-G2, current_version=3
08:49 old worker still processes archived delta-G1 input under batch_id=441
08:50 Segment accepts old-S-A100-8; legacy response old-L-A100-8 times out
08:51 worker exits before appending history for TEN-A/C100 sequence 8
08:52 control says LAST_SEEN_VERSION=706, LAST_PROVEN_VERSION=700
08:53 new worker starts batch_id=0; job dashboard shows SUCCESS
08:54 legacy acknowledgement enters Bronze with source_kind=WRITEBACK_ACK
```

Your assignment has the following scope and constraints.

Repair this single promotion-export incident end to end: source continuity, PySpark ingestion, Snowflake history/current state, both destinations, legacy feedback and the certified status interface. Submit executable code/configuration plus a recovery runbook. Choose your implementation; diagnose the failure mechanisms yourself.

- Preserve the five intended changes, their full tenant identities and all source evidence. Do not edit expected records or discard the withdrawal, late correction or source-table identity.
- During recovery, no new outbound attempt may precede durable matching authorization history. Reconstruct missing history honestly and label the two pre-existing violations.
- A checkpoint, an HTTP receipt, or one destination's success cannot alone substantiate completion of this multi-system business operation.
- No revision regression, repeated business effect, phantom history revision or new decision from an acknowledgement is allowed. All captured records need an auditable disposition.
- Multiple sender processes and lost responses must be addressed. You cannot assume a distributed transaction spanning Delta, Snowflake and both adapters or change the supplied receiver contracts.
- If archive evidence is missing or altered, do not silently substitute the replacement snapshot or advance the certified release. Define how recovery and normal streaming resume after continuity is established.
- The sender has no guest PII or unrestricted Raw access. Marketing readers get only the tenant-authorized final interface. CI uses fixture data. Include actual restricted-role test SQL and the corresponding Unity Catalog permissions.
- Recovery may read only declared source ranges and affected keys, plus necessary bounded metadata. Warehouse or worker enlargement alone is not evidence of improvement.
- Separate measured results from proposed load tests. Native Databricks/Snowflake execution that you cannot perform must be marked UNVERIFIED, with commands to reproduce it.

Your submission must meet all six acceptance criteria.

1. Snowflake current state and both destinations end at TEN-A/C100 seq8 O11 ACTIVE; TEN-A/C200 seq5 null WITHDRAWN; TEN-B/C100 seq3 O31 ACTIVE; TEN-B/C300 seq9 O41 ACTIVE; TEN-A/C400 seq1 O50 ACTIVE. The final interface reports four active offers and one withdrawal, with zero tenant collisions.
2. History contains exactly nine distinct approved decision revisions: four baseline and five new. Every one of the 12 captured CDF inputs is accounted for. The delete, preimages, duplicated captures and acknowledgement echoes create zero extra decisions.
3. The receiver application log contains exactly ten new business applications across both destinations, including the two already applied: recovery adds eight. Every intended destination result is proven, no new authorization-history gap occurs, and the two original violations remain explicitly recorded.
4. Replaying the same recovery, resetting the sender process, overlapping two sender workers, delaying one destination, injecting 429, and timing out after apply cannot change the final business values, duplicate history or rewrite original history timestamps. New attempt-audit rows are allowed. A conflicting same-key/same-sequence body, missing archive version or altered archive hash must prevent a false COMPLETE release and retain the previous certified interface.
5. No source or destination mismatch remains at completion. A legacy acknowledgement replay causes zero new business applications. Marketing/CI negative access tests have zero unauthorized successes, and the final report links each changed key to source evidence, history and both destination results.
6. For the production load test, recover 86,000 affected keys from 172,000 distinct CDF events and 206,400 physical captures within 20 minutes, at most 8 Snowflake warehouse credits and at most 600 combined adapter requests/second. Scan at most 120 GiB in Snowflake and never collect the full production input on the driver. Record Spark task/retry/skew metrics, memory/spill, query IDs, bytes scanned, DBUs separately, API request rates, lag and before/after evidence. The small fixture is for correctness and is not a claim of production-scale measurement.

The original production incident scanned 1.8 TiB of history, attempted to collect a 34-million-row snapshot on an 8-GiB driver, took 63 minutes and consumed 29 Snowflake warehouse credits. There are 600 million historical decision rows. Treat those as supplied mock incident measurements.

Submit the following deliverables.

Submit your reasoning, revised PySpark and Snowflake SQL, source-continuity and restart procedure, delivery/feedback code, authorization and publication checks, failure-injection tests, observability queries, restricted-role tests, rollback boundaries and a bounded incident plan. No answer key is included.

Grading: correctness 35; production reliability/data quality 25; scalability/performance/cost 15; governance/security 10; testing/observability 10; explanation/tradeoffs 5. A score below 85 triggers a new attempt on the same pattern.

Interface references checked September 26, 2026: Databricks CDF metadata and foreachBatch callback documentation. These support the API vocabulary; mock company contracts are defined by this brief.

- https://docs.databricks.com/aws/en/tables/features/change-data-feed
- https://docs.databricks.com/aws/en/structured-streaming/foreach