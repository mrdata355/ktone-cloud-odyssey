
(function(){
"use strict";
if(!window.CloudOdyssey){console.error("Coding Forge requires CloudOdyssey");return;}
var CO=window.CloudOdyssey, KEY="cloud_odyssey_coding_forge_v1";
var st=Object.assign({mode:"build",category:"all",index:0,attempts:[],files:{},match:{category:"problem",round:0,correct:0,wrong:0,matched:{}}},JSON.parse(localStorage.getItem(KEY)||"{}"));
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var save=function(){localStorage.setItem(KEY,JSON.stringify(st));};
var esc=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});};
var shuffle=function(a){var x=a.slice();for(var i=x.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=x[i];x[i]=x[j];x[j]=t;}return x;};

function P(name,cat,who,what,where,when,why,how,caveat){
 return {name:name,cat:cat,who:who,what:what,where:where,when:when,why:why,how:how,caveat:caveat};
}
var patterns=[
P("CTE","SQL","A logical query step/result set","Break a complex query into named stages","WITH clause before the consuming statement","When readability, reuse in the statement, recursion, or staged logic helps","Makes reasoning and debugging easier","WITH x AS (...) SELECT ... FROM x","A CTE is not automatically faster; many engines inline it. Use it for structure first, then verify the plan."),
P("Recursive CTE","SQL","A hierarchy or generated sequence","Repeatedly reference prior rows until a stop condition","WITH RECURSIVE / recursive CTE syntax","Hierarchies, graph-like parent-child traversal, sequences","Expresses iterative relationships declaratively","anchor query UNION ALL recursive query","Guard termination and depth; recursion can be expensive."),
P("WHERE","SQL","Rows before aggregation","Filter input rows","Before GROUP BY","When a condition applies to raw/detail rows","Reduces data before later operations","SELECT ... FROM t WHERE condition","Putting aggregate filters here is invalid or changes logic."),
P("HAVING","SQL","Groups after aggregation","Filter aggregated groups","After GROUP BY","When the predicate depends on COUNT/SUM/AVG/etc.","Filters business groups using aggregate results","GROUP BY dept HAVING COUNT(*) > 5","Prefer WHERE for pre-aggregation filters to reduce work."),
P("UNION ALL","SQL","Two compatible result sets","Append rows and retain duplicates","Between SELECT statements","When duplicate elimination is not required","Avoids the extra deduplication work of UNION","SELECT ... UNION ALL SELECT ...","Use UNION when semantic uniqueness is required; do not choose ALL only for speed."),
P("UNION","SQL","Two compatible result sets","Append rows and remove duplicate rows","Between SELECT statements","When the combined result must be distinct","Enforces set uniqueness","SELECT ... UNION SELECT ...","Deduplication costs work; confirm that duplicate removal is truly required."),
P("INNER JOIN","SQL","Matching rows from two relations","Return rows with a match on both sides","JOIN ... ON","When unmatched rows should be excluded","Combines related entities at a declared join grain","A JOIN B ON A.key=B.key","NULL join keys do not match under ordinary equality."),
P("LEFT JOIN","SQL","All left rows plus matching right rows","Preserve the driving table even without a match","LEFT JOIN ... ON","When missing right-side relationships must remain visible","Supports completeness checks and optional dimensions","A LEFT JOIN B ON A.key=B.key","Filtering right-side columns in WHERE can accidentally turn it into inner-join behavior."),
P("EXISTS","SQL","An outer row plus a related existence check","Test whether at least one matching row exists","WHERE EXISTS(subquery)","Large lookup/existence checks where right-side values are not needed","Can avoid materializing duplicate join matches","WHERE EXISTS (SELECT 1 FROM B WHERE B.key=A.key)","Optimizers may rewrite alternatives; verify plan rather than assuming."),
P("ROW_NUMBER","Window","Rows within an ordered partition","Assign unique sequential numbers","OVER(PARTITION BY ... ORDER BY ...)","Latest-row selection, deterministic top N, deduplication","Forces one unique row position even when values tie","ROW_NUMBER() OVER(PARTITION BY k ORDER BY ts DESC)","Tie-breaking must be deterministic if exact repeatability matters."),
P("RANK","Window","Rows within an ordered partition","Rank with gaps after ties","Window OVER clause","Top N with ties where skipped positions are acceptable","Preserves competition-style ranking semantics","RANK() OVER(PARTITION BY dept ORDER BY salary DESC)","Do not use when you need exactly N rows per group."),
P("DENSE_RANK","Window","Rows within an ordered partition","Rank ties without gaps","Window OVER clause","Nth distinct value, top N distinct ranks","Represents distinct ordered levels","DENSE_RANK() OVER(ORDER BY salary DESC)","Can return multiple rows for the same rank."),
P("LAG","Window","A row plus earlier ordered row","Read a previous value without self-joining","Window OVER clause","Period-over-period comparisons, change detection, session logic","Makes relative-row comparisons concise","LAG(value) OVER(PARTITION BY k ORDER BY ts)","The sort order defines meaning; missing order semantics creates wrong comparisons."),
P("LEAD","Window","A row plus later ordered row","Read a following value","Window OVER clause","Next-state, interval, or future-row comparisons","Avoids self-joins for adjacent-row logic","LEAD(value) OVER(PARTITION BY k ORDER BY ts)","It looks forward within the query result, not future data outside the dataset."),
P("Running Total","Window","An ordered series","Cumulatively aggregate through the current row","SUM(...) OVER(ORDER BY ... ROWS ...)","Balances, cumulative revenue, rolling operational metrics","Preserves row detail while adding aggregate context","SUM(amount) OVER(PARTITION BY k ORDER BY ts ROWS UNBOUNDED PRECEDING)","Specify the window frame explicitly when engine defaults could change tie behavior."),
P("NTILE","Window","Ordered rows","Split rows into approximately equal buckets","Window OVER clause","Quartiles/deciles/banding","Produces relative buckets without separate aggregation","NTILE(4) OVER(ORDER BY score DESC)","Buckets can differ by one row and are count-based, not equal value ranges."),
P("MERGE / UPSERT","SQL","Source changes and target current state","Update matching rows and insert new rows","MERGE statement / engine-specific upsert","Incremental current-state loads with stable keys","Retries can converge on one target state","MERGE INTO target USING source ON key ...","Declare key and precedence first; MERGE cannot fix ambiguous business identity."),
P("Transaction","SQL","A related set of database mutations","Commit all-or-nothing changes inside one transactional boundary","BEGIN / COMMIT / ROLLBACK","When mutations must succeed atomically in one database boundary","Prevents partial local state","BEGIN; ... COMMIT;","External APIs or separate systems are outside the database transaction."),
P("DDL","SQL Commands","Database objects","Define or change structure","CREATE / ALTER / DROP / TRUNCATE (classification varies by engine)","Schema/object management","Controls physical/logical structures","CREATE TABLE ...","Command classification and transaction behavior vary by database."),
P("DML","SQL Commands","Rows in data objects","Insert, update, delete, merge data","INSERT / UPDATE / DELETE / MERGE","Changing stored row state","Mutates business data","UPDATE ... SET ...","Some vendors classify MERGE differently; focus on behavior."),
P("DCL","SQL Commands","Users/roles/privileges","Grant or revoke access","GRANT / REVOKE","Governance and least privilege","Controls who can do what","GRANT SELECT ON ... TO ROLE ...","Cloud platforms can add policy/role layers beyond classic SQL DCL."),
P("TCL","SQL Commands","A transaction","Commit, roll back, or create savepoints","COMMIT / ROLLBACK / SAVEPOINT","Managing transaction boundaries","Controls local atomicity","SAVEPOINT x; ... ROLLBACK TO x","Autocommit and savepoint support differ across engines."),
P("DQL / SELECT","SQL Commands","Queryable relations","Read/derive result sets","SELECT","Data retrieval and analytical computation","Expresses requested data result","SELECT ... FROM ...","DQL is a teaching classification; vendors do not all use the term formally."),
P("Execution Plan","SQL Performance","A query and the optimizer's chosen operators","Inspect scans, joins, estimates, sorts, shuffles","EXPLAIN / query profile / actual plan","When latency/cost is high or cardinality looks wrong","Reveals where work actually occurs","EXPLAIN SELECT ...","Operator names differ by engine; focus on data movement, cardinality, scan and spill."),
P("Index Seek","SQL Performance","Rows accessible through a selective index path","Read only matching index ranges/keys","Traditional indexed OLTP engines","Selective predicates on indexed keys","Avoids scanning most table pages","seek on indexed predicate","Snowflake/BigQuery/Databricks do not use classic B-tree index seeks the same way."),
P("Index Scan","SQL Performance","A substantial portion of an index","Read many index pages","Traditional indexed engines","When many rows/columns are needed but index still covers useful data","Can be cheaper than table scan depending on coverage","scan index","A scan is not automatically bad; low selectivity may make it optimal."),
P("Table Scan","SQL Performance","The full table/partition set","Read rows without a selective access path","Execution plan","Large unfiltered reads or missing pruning/indexing","Signals high I/O when only a small subset is needed","full scan","Analytical engines often intentionally scan columns; judge bytes/partitions, not label alone."),
P("Predicate Pushdown","SQL Performance","Filters near the source","Apply predicates before expensive movement/transforms","Storage scan / connector / optimizer","Selective filters on large datasets","Reduces rows/bytes carried downstream","filter early on partition/selective columns","Functions/casts on filtered columns may reduce pushdown depending on engine."),
P("Column Pruning","SQL Performance","Only needed fields","Read/project fewer columns","Source scan and early SELECT","Wide tables where only a subset is required","Reduces I/O and memory","SELECT needed_cols","SELECT * can be acceptable during exploration but not a default production pattern."),
P("Partition Pruning","SQL Performance","Only relevant partitions/micro-partitions/files","Skip storage outside filter ranges","Storage layer","Time/range/clustered data with selective predicates","Removes unnecessary I/O entirely","filter directly on partition/clustering columns","Wrapping partition columns in functions can prevent pruning in some engines."),
P("Materialized View / Summary Table","SQL Performance","Precomputed repeated analytical results","Store reusable aggregates/results","Database/warehouse serving layer","Repeated expensive reports with tolerable refresh delay","Trades storage/refresh cost for read speed","precompute common aggregate","Freshness and maintenance cost must fit the business requirement."),
P("AQE","Spark Performance","Spark query stages at runtime","Adapt joins, coalesce partitions, and mitigate skew using runtime stats","Spark SQL adaptive execution","When runtime cardinality/skew differs from static plan estimates","Lets Spark revise parts of the plan after observing data","spark.sql.adaptive.enabled=true","AQE helps but is not a substitute for fixing pathological keys or bad partitioning."),
P("Broadcast Join","Spark Performance","A small relation plus a large relation","Replicate the small side to executors to avoid shuffling the large side","Spark join planning","When the small side fits executor memory safely","Removes a large shuffle","broadcast(dim).join(fact,...)","Broadcasting a relation that is too large can cause memory pressure/OOM."),
P("Salting","Spark Performance","A hot/skewed key","Add a synthetic bucket to spread one key across partitions","Before skewed join/aggregation","Severe key skew that cannot be solved by normal partitioning","Distributes hotspot work","add salt to hot side and replicate/align other side","Adds complexity and requires careful recombination; use only for real skew."),
P("Repartition","Spark Performance","A DataFrame and desired partitioning","Shuffle data into a new partition layout","df.repartition(...)","Before expensive keyed operations or to rebalance uneven partitions","Can improve parallelism/locality","df.repartition(n, 'key')","Repartition itself is a shuffle; do not add it blindly."),
P("Pre-filter / Pre-aggregate","Spark Performance","Large datasets before a join/shuffle","Reduce rows/columns or aggregate early","Upstream of expensive shuffle","When downstream logic does not need full detail","Shrinks data movement","filter/select/groupBy before join","Do not pre-aggregate if detail is required later or if it changes semantics."),
P("Spark Skew Diagnosis","Spark Performance","Uneven partition/task sizes","Identify one/few slow tasks and hot keys","Spark UI / SQL metrics","When most tasks finish quickly but a few dominate stage time","Targets the real bottleneck instead of scaling the whole cluster","inspect task duration/input/shuffle by partition","A slow task can also be I/O, spill, GC, or external latency; verify key distribution."),
P("PySpark select","PySpark","A DataFrame","Project required columns","df.select(...)","Column pruning / reshaping","Keeps transformations explicit and narrow","df.select('id','name')","Prefer explicit columns in production contracts."),
P("PySpark filter","PySpark","DataFrame rows","Keep rows satisfying a condition","df.filter / df.where","Row filtering","Pushes selective logic early when optimizer can","df.filter(F.col('age') > 25)","Avoid Python UDFs in predicates when native expressions suffice."),
P("PySpark withColumn","PySpark","A DataFrame column","Create/replace a derived column","df.withColumn(...)","Derived attributes and type conversion","Keeps logic in Spark expression plan","df.withColumn('x', F.col('a')+1)","Repeated withColumn chains can produce unwieldy plans; select expressions can be cleaner."),
P("PySpark groupBy/agg","PySpark","Rows sharing keys","Aggregate measures by group","df.groupBy(...).agg(...)","Business aggregates","Expresses distributed aggregation","df.groupBy('dept').agg(F.avg('salary'))","Watch skew and shuffle volume."),
P("PySpark join","PySpark","Two DataFrames","Combine rows by a relationship","df.join(other, condition, type)","Entity/fact enrichment","Distributed relational combination","df1.join(df2,'id','left')","Choose join type and broadcast/repartition based on semantics and size."),
P("unionByName","PySpark","Compatible DataFrames","Append rows matching columns by name","df.unionByName(other)","Schema-aligned append","Avoids relying on column position","df.unionByName(other, allowMissingColumns=True)","Missing columns and type differences still require contract decisions."),
P("explode","PySpark","An array/map nested column","Turn elements into rows","F.explode / explode_outer","Flatten nested records","Makes item-level grain explicit","df.withColumn('item',F.explode('items'))","explode changes grain and row counts; declare the new grain."),
P("Pivot","PySpark","Long-form category rows","Turn category values into columns","groupBy(...).pivot(...).agg(...)","Small controlled category sets","Creates presentation/feature matrices","df.groupBy('id').pivot('year').sum('value')","High-cardinality pivot values can explode schema width."),
P("Cache / Persist","Spark Performance","A repeatedly reused computed DataFrame","Keep materialized data across actions","df.cache / persist","When recomputation cost exceeds memory/storage cost","Avoids repeating expensive lineage","df.persist(...)","Caching one-use or huge datasets can reduce performance."),
P("Missing-value handling","Data Cleaning","Rows/columns containing null/missing data","Fill, drop, flag, or model missingness deliberately","Cleaning/feature preparation","When null semantics are understood","Prevents accidental failures or biased calculations","fillna/dropna/COALESCE","Do not blindly fill with mean/zero; missingness can carry business meaning."),
P("Duplicate handling","Data Cleaning","Repeated rows/entities","Identify duplicate identity and choose keep/reconcile behavior","Cleaning / quality","When the declared grain requires uniqueness","Prevents double counting","duplicated/drop_duplicates/ROW_NUMBER","Exact row duplicates and business duplicates are different problems."),
P("Outlier handling","Data Cleaning","Extreme observations","Detect, investigate, cap, transform, or retain based on domain meaning","Exploration / quality / modeling","When extremes can be error or legitimate rare behavior","Protects downstream statistics without deleting valid edge cases","IQR/z-score/domain bounds","Never remove outliers automatically without business context."),
P("Type coercion","Data Cleaning","Columns with wrong/ambiguous types","Convert strings/numbers/dates with explicit error handling","Cleaning boundary","At ingestion/contract normalization","Makes comparisons and aggregations deterministic","to_numeric/to_datetime/cast","Failed conversions should be surfaced, not silently turned into plausible values."),
P("String normalization","Data Cleaning","Messy textual identifiers/categories","Trim/case/regex/standardize","Cleaning boundary","Before matching, grouping, or keys","Reduces accidental distinct values","strip/lower/regex_replace","Do not normalize away meaningful distinctions."),
P("Date normalization","Data Cleaning","Date/time values","Parse timezone-aware timestamps and derive date parts","Ingestion/modeling","Before time filtering/windowing","Prevents timezone and lexical comparison errors","to_datetime / CAST timestamp","Always define timezone and source-time semantics."),
P("DataFrame Filtering","Data Cleaning","Rows in Pandas/Spark","Select rows by explicit conditions","loc/query/filter expressions","When analysis/model input needs a subset","Makes scope explicit","df.loc[condition]","Boolean precedence and null behavior can surprise; parenthesize compound predicates.")
];

function C(title,cat,lang,scenario,who,what,where,when,why,how,starter,solution,tokens,tests,filePath,fileWhy,caveat){
 return {title:title,cat:cat,lang:lang,scenario:scenario,who:who,what:what,where:where,when:when,why:why,how:how,starter:starter,solution:solution,tokens:tokens,tests:tests,filePath:filePath,fileWhy:fileWhy,caveat:caveat};
}
var challenges=[
C("Second-highest distinct salary","SQL","sql","Employees can share salary values. Return every employee earning the second-highest distinct salary.","Employee salary rows","Rank distinct salary levels","Across the full employee set","When ties must return together","DENSE_RANK models distinct salary levels without rank gaps","Rank salaries descending, then filter rank=2",
"SELECT emp_id, emp_name, salary\nFROM employees\n-- TODO: second-highest distinct salary",
"WITH ranked AS (\n SELECT emp_id, emp_name, salary,\n DENSE_RANK() OVER(ORDER BY salary DESC) AS rnk\n FROM employees\n)\nSELECT emp_id, emp_name, salary FROM ranked WHERE rnk=2;",
["dense_rank","over","where"],["handles ties","returns second distinct salary","does not rely on MAX trick"],"sql/interview/second_highest_salary.sql","The filename says exactly which interview pattern the query implements; the folder separates SQL practice from production models.","MAX/subquery can work, but DENSE_RANK generalizes to nth distinct levels."),
C("Top 2 earners per department","SQL","sql","Return two highest-paid employees per department with deterministic tie-breaking.","Employee rows grouped by department","Assign within-department row position","PARTITION BY department","When the output must contain exactly two rows per department","ROW_NUMBER gives an exact row count when ORDER BY includes a stable tie-breaker","ROW_NUMBER over department, salary DESC, emp_id",
"SELECT * FROM employees;\n-- TODO: exactly 2 per department",
"WITH x AS (\n SELECT *, ROW_NUMBER() OVER(PARTITION BY department ORDER BY salary DESC, emp_id) AS rn\n FROM employees\n) SELECT * FROM x WHERE rn<=2;",
["row_number","partition by","order by"],["exactly two per group","deterministic ties","partition by department"],"sql/patterns/top_n_per_department.sql","The name captures the reusable pattern, not one company's employee table.","Use RANK/DENSE_RANK instead when ties should expand the result."),
C("WHERE vs HAVING production filter","SQL","sql","Return departments whose total salary exceeds 150000, but exclude inactive employees before aggregation.","Active employee rows then department groups","Filter rows before SUM and groups after SUM","WHERE before GROUP BY; HAVING after","When raw-row eligibility and aggregate eligibility are separate rules","Separating the two prevents inactive rows from inflating totals","WHERE active=1 then GROUP BY department HAVING SUM(salary)>150000",
"SELECT department, SUM(salary) total_salary\nFROM employees\nGROUP BY department;",
"SELECT department, SUM(salary) AS total_salary\nFROM employees\nWHERE active=1\nGROUP BY department\nHAVING SUM(salary)>150000;",
["where","group by","having"],["inactive filtered first","aggregate condition after group","returns department totals"],"sql/patterns/where_vs_having.sql","The filename states the decision pattern the drill is teaching.","Putting SUM condition in WHERE is invalid; putting active in HAVING does extra work and can change meaning."),
C("Deduplicate latest customer record","SQL","sql","Customer CDC contains multiple versions per customer. Keep the latest event by event_time, breaking ties by event_version.","Customer-version rows","Choose one current row per customer","Window partition by customer_id","After CDC/replay when a current snapshot is needed","Stable ordering makes retries deterministic","ROW_NUMBER ordered by event_time DESC, event_version DESC",
"SELECT * FROM customer_events;\n-- TODO current row",
"WITH x AS (\n SELECT *, ROW_NUMBER() OVER(PARTITION BY customer_id ORDER BY event_time DESC, event_version DESC) rn\n FROM customer_events\n) SELECT * FROM x WHERE rn=1;",
["row_number","customer_id","event_time"],["one row per customer","latest event","stable tiebreak"],"sql/cdc/customer_latest.sql","The path identifies CDC semantics and that this file produces current customer state.","DISTINCT cannot decide which version is authoritative."),
C("Null-safe department enrichment","SQL","sql","Keep all employees even if dept_id is NULL or has no matching department.","Employee rows as driving population","Attach optional department attributes","LEFT JOIN from employees","When missing dimension relationships must remain visible","LEFT JOIN preserves completeness for quality analysis","employees LEFT JOIN departments on dept_id",
"SELECT e.emp_id,e.name,d.department\nFROM employees e\nJOIN departments d ON e.dept_id=d.dept_id;",
"SELECT e.emp_id,e.name,d.department\nFROM employees e\nLEFT JOIN departments d ON e.dept_id=d.dept_id;",
["left join","on"],["keeps NULL dept employees","keeps unmatched dept IDs","no accidental WHERE right filter"],"sql/joins/employee_department_left_join.sql","The name records join direction and entities, useful during code review.","INNER JOIN would silently remove unmatched employees."),
C("Month-over-month revenue","SQL","sql","For each resort, calculate current-month revenue and previous-month revenue without self-joining the aggregate.","Monthly resort revenue rows","Compare a row with its previous month","LAG over resort ordered by month","Period-over-period reporting","LAG makes ordered relative comparison explicit","Aggregate monthly revenue, then LAG",
"SELECT resort_id, month, SUM(revenue) revenue\nFROM stays\nGROUP BY resort_id, month;",
"WITH m AS (SELECT resort_id, month, SUM(revenue) revenue FROM stays GROUP BY resort_id,month)\nSELECT *, LAG(revenue) OVER(PARTITION BY resort_id ORDER BY month) AS prev_revenue\nFROM m;",
["lag","partition by","order by"],["previous month per resort","no self join","ordered months"],"sql/analytics/month_over_month_revenue.sql","The file name describes the business comparison rather than the implementation detail.","Ensure month values are real sortable dates, not ambiguous strings."),
C("Recursive sequence generator","SQL","sql","Generate integers 1 through 5 inside SQL for a controlled recursive CTE exercise.","An integer sequence","Iteratively create the next integer","Recursive CTE","When testing recursive syntax or building small generated series","Shows anchor + recursive member + termination","1 UNION ALL n+1 WHERE n<5",
"WITH RECURSIVE numbers AS (\n SELECT 1 AS n\n -- TODO\n)\nSELECT * FROM numbers;",
"WITH RECURSIVE numbers AS (\n SELECT 1 AS n\n UNION ALL\n SELECT n+1 FROM numbers WHERE n<5\n) SELECT * FROM numbers;",
["with recursive","union all","n+1"],["starts at 1","stops at 5","five rows"],"sql/patterns/recursive_sequence.sql","The file isolates recursion practice from business queries.","For large series, engine-native generators/calendar tables are usually better."),
C("Skewed Spark join","Spark Performance","pyspark","One join key owns 2.5M rows while peer partitions contain about 10–12K. One task dominates stage time.","Hot-key fact rows and a small dimension","Reduce or redistribute skew before the join","Spark shuffle/join boundary","When Spark UI shows extreme task/input-size imbalance","Fix the hotspot rather than scaling every executor","Filter/project first; broadcast small dimension or salt severe hot key",
"result = facts.join(dim, 'customer_id')\n# TODO optimize skew",
"from pyspark.sql import functions as F\nfrom pyspark.sql.functions import broadcast\nsmall = dim.select('customer_id','segment')\nresult = facts.select('customer_id','amount').join(broadcast(small),'customer_id','left')",
["broadcast","select","join"],["avoids large-side shuffle when dimension is small","prunes columns","preserves left rows"],"spark/jobs/customer_segment_enrichment.py","A job filename should state the business transformation, not merely 'spark_job.py'.","Broadcast only if the dimension safely fits executor memory; otherwise use AQE/salting/repartition based on evidence."),
C("Salt a pathological hot key","Spark Performance","pyspark","A single customer_id dominates a large-large aggregation/join and cannot be broadcast.","Rows sharing one extreme key","Spread hot-key work across synthetic buckets","Before shuffle; recombine after","When measured skew remains severe after pruning/AQE","Salting trades implementation complexity for parallelism on the hotspot","Create salt bucket for hot key; align counterpart; aggregate/recombine",
"hot = df.filter(F.col('customer_id')=='HOT')\n# TODO distribute work",
"salted = df.withColumn('salt', F.when(F.col('customer_id')=='HOT',(F.rand()*16).cast('int')).otherwise(F.lit(0)))",
["withcolumn","salt","rand"],["creates multiple buckets","only hot key needs spreading","requires recombination plan"],"spark/performance/salt_hot_customer.py","The name documents the exceptional performance technique and the key domain.","Do not salt normal distributions; it complicates joins and downstream grouping."),
C("Explode reservation items","PySpark","pyspark","A reservation row contains an items array. Produce one row per reservation item while retaining reservations with empty arrays.","Reservation rows with nested items","Change grain from reservation to reservation-item","explode_outer(items)","When downstream logic needs item-level facts","Makes nested collection grain explicit and preserves empty arrays","withColumn item=explode_outer(items)",
"from pyspark.sql import functions as F\nitems = reservations\n# TODO",
"from pyspark.sql import functions as F\nitems = reservations.withColumn('item', F.explode_outer('items')).select('reservation_id','item.*')",
["explode_outer","reservation_id","select"],["item-level rows","empty array parent retained","explicit grain"],"spark/transforms/explode_reservation_items.py","The filename names the grain-changing transform, which matters during lineage reviews.","explode (without outer) can drop null/empty arrays."),
C("Incremental inventory MERGE","Databricks","sql","Silver inventory changes must update Gold current state without rewriting unrelated resorts.","Changed inventory business keys","Upsert changed keys into current state","Delta MERGE","Incremental current-state publication","Bounds mutation and makes retry converge","MERGE on inventory_id with matched update/unmatched insert",
"MERGE INTO gold_inventory t USING staged s\nON /* TODO */",
"MERGE INTO gold_inventory t USING staged s\nON t.inventory_id=s.inventory_id\nWHEN MATCHED THEN UPDATE SET *\nWHEN NOT MATCHED THEN INSERT *;",
["merge into","inventory_id","when matched"],["stable key","update+insert","bounded current state"],"databricks/sql/merge_inventory_current.sql","The path says this is Databricks SQL and the name says it mutates inventory current state.","A MERGE is only as correct as its business key and precedence logic."),
C("Data cleaning contract","Data Cleaning","python","A CSV has blank salaries, duplicate employee IDs, inconsistent city casing, string dates, and one extreme salary value.","Employee records at ingestion","Normalize types/strings, surface missingness, deduplicate under an explicit rule, inspect outlier","Pandas boundary before analytics/modeling","When external files violate the expected analytical schema","Prevents hidden coercion and double counting while retaining auditability","parse dates/numbers, normalize strings, flag/drop duplicates by key, inspect outlier",
"import pandas as pd\ndf = pd.read_csv('employees.csv')\n# TODO clean safely",
"df['date']=pd.to_datetime(df['date'],errors='coerce')\ndf['salary']=pd.to_numeric(df['salary'],errors='coerce')\ndf['city']=df['city'].str.strip().str.lower()\ndf=df.sort_values('date').drop_duplicates('employee_id',keep='last')",
["to_datetime","to_numeric","drop_duplicates"],["explicit conversion","business-key dedupe","string normalization"],"python/cleaning/employee_ingestion_clean.py","The name says this is ingestion cleaning, not a generic notebook scratch file.","Outliers should be flagged/investigated rather than blindly removed."),
C("Query-plan first optimization","SQL Performance","sql","A reporting query takes 10 minutes instead of 10 seconds. You are asked to optimize before changing business logic.","The slow query and its physical execution","Find the dominant scan/join/sort/data-movement cost","EXPLAIN/query profile","Before applying indexes, clustering, rewrites, or more compute","Evidence identifies the bottleneck and prevents cargo-cult tuning","Inspect plan → cardinality → scan/pruning → joins → sort/spill",
"SELECT /* slow report */ * FROM orders o JOIN customers c ON o.customer_id=c.customer_id;",
"EXPLAIN SELECT o.order_id,o.order_date,o.amount,c.customer_name\nFROM orders o JOIN customers c ON o.customer_id=c.customer_id\nWHERE o.order_date >= '2026-01-01';",
["explain","where","join"],["plan inspection","selective predicate","needed columns only"],"sql/performance/order_report_explain.sql","The suffix _explain distinguishes diagnostic SQL from production-serving query code.","Classic index advice is engine-specific; Snowflake/Databricks/BigQuery require pruning/clustering/query-profile thinking instead."),
C("UNION versus UNION ALL","SQL","sql","Append two source feeds that are contractually disjoint by source_system. Duplicate removal is unnecessary.","Rows from two disjoint feeds","Append them","Set-combination boundary","When contracts prove duplicates across feeds cannot represent the same row","UNION ALL avoids unnecessary duplicate elimination","SELECT ... UNION ALL SELECT ...",
"SELECT * FROM feed_a\nUNION\nSELECT * FROM feed_b;",
"SELECT * FROM feed_a\nUNION ALL\nSELECT * FROM feed_b;",
["union all"],["retains all rows","avoids dedupe step","contract says sources disjoint"],"sql/patterns/union_all_disjoint_feeds.sql","The filename documents the assumption that makes UNION ALL safe.","If duplicate rows have business meaning or feeds overlap, reconcile identity instead of assuming."),
C("Cache only reused expensive DataFrame","Spark Performance","pyspark","An expensive normalized DataFrame feeds three downstream actions in the same job.","A computed DataFrame reused three times","Persist its computed partitions for reuse","After expensive reusable transformation","When recomputation cost exceeds memory/storage cost","Avoids repeating lineage three times","persist normalized, use, then unpersist",
"normalized = raw.transform(normalize)\n# three actions below",
"normalized = raw.transform(normalize).persist()\nnormalized.count()\nwrite_a(normalized)\nwrite_b(normalized)\nnormalized.unpersist()",
["persist","unpersist"],["reuse multiple actions","explicit release","not cache raw blindly"],"spark/performance/persist_reused_normalized.py","The filename explains why persistence exists so future engineers do not remove or copy it blindly.","Caching a one-use or oversized DataFrame can hurt cluster performance.")
];

var fileChoices=[
"sql/interview/second_highest_salary.sql",
"sql/query.sql",
"scripts/final.sql",
"notebooks/second_salary.ipynb",
"spark/jobs/customer_segment_enrichment.py",
"spark/spark_job.py",
"python/main.py",
"databricks/sql/merge_inventory_current.sql",
"sql/merge.sql",
"python/cleaning/employee_ingestion_clean.py",
"clean_data.py",
"spark/performance/persist_reused_normalized.py"
];

var pyPromise=null,py=null;
function ensurePy(){
 if(py)return Promise.resolve(py);
 if(pyPromise)return pyPromise;
 pyPromise=new Promise(function(resolve,reject){
  function go(){loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v314.0.7/full/"}).then(function(x){py=x;resolve(py);}).catch(reject);}
  if(window.loadPyodide)return go();
  var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js";s.onload=go;s.onerror=reject;document.head.appendChild(s);
 });return pyPromise;
}
function categories(){var o={};challenges.forEach(function(c){o[c.cat]=1;});return Object.keys(o).sort();}
function pool(){return st.category==="all"?challenges:challenges.filter(function(c){return c.cat===st.category;});}
function cur(){var p=pool();st.index=((st.index%p.length)+p.length)%p.length;return p[st.index];}
function currentScore(){
 var a=st.attempts.slice(-25);if(!a.length)return {score:0,dims:{}};
 var dims=["Correctness","Pattern","Production","Optimization","Explainability","Transfer","File Discipline","First Pass"],d={};
 dims.forEach(function(k){d[k]=Math.round(a.reduce(function(n,x){return n+(x.dims[k]||0);},0)/a.length);});
 return {score:Math.round(dims.reduce(function(n,k){return n+d[k];},0)/dims.length),dims:d};
}
function tokenGrade(c,text){
 var low=text.toLowerCase(),hits=c.tokens.filter(function(t){return low.indexOf(t.toLowerCase())>=0;});
 var correctness=Math.min(100,35+Math.round(hits.length/c.tokens.length*65));
 var production=Math.min(100,35+(/key|partition|order|where|left|merge|persist|outer|coerce|error|explicit|select/.test(low)?25:0)+hits.length*10);
 var optimization=Math.min(100,35+(/select|where|broadcast|persist|explain|partition|prun|filter|unpersist/.test(low)?35:0)+hits.length*5);
 return {hits:hits,correctness:correctness,production:production,optimization:optimization};
}
function explanationGrade(text,c){
 var low=(text||"").toLowerCase();
 var v=25;
 if(/because|so that|which means|therefore/.test(low))v+=20;
 if(/instead|rather than|versus|vs/.test(low))v+=20;
 if(/business|risk|replay|cost|correct|determin|grain|key|performance/.test(low))v+=20;
 if(text.length>140)v+=15;
 return Math.min(100,v);
}
async function runActual(c,code,out){
 out.classList.remove("bad");out.textContent="$ running...";
 if(c.lang==="sql"){
  try{
   var p=await ensurePy();p.globals.set("USER_SQL",code);
   var setup="import sqlite3\ncon=sqlite3.connect(':memory:')\nc=con.cursor()\n"+
   "c.execute('CREATE TABLE employees(emp_id INTEGER, emp_name TEXT, department TEXT, salary INTEGER, active INTEGER, dept_id INTEGER)')\n"+
   "c.executemany('INSERT INTO employees VALUES (?,?,?,?,?,?)',[(1,'Alice','Sales',50000,1,10),(2,'Bob','Sales',60000,1,10),(3,'Charlie','HR',55000,1,None),(4,'David','IT',80000,1,20),(5,'Eva','IT',70000,0,20),(6,'Frank','Finance',65000,1,30),(7,'Grace','Finance',72000,1,30),(8,'Hank','Finance',65000,1,30)])\n"+
   "c.execute('CREATE TABLE departments(dept_id INTEGER, department TEXT)')\nc.executemany('INSERT INTO departments VALUES (?,?)',[(10,'Sales'),(20,'IT'),(30,'Finance')])\n"+
   "try:\n r=c.execute(USER_SQL)\n print(' | '.join([x[0] for x in r.description]) if r.description else 'ok')\n [print(' | '.join('NULL' if z is None else str(z) for z in row)) for row in r.fetchall()]\nexcept Exception as e:\n print('SQL_ERROR:',e)\ncon.close()";
   var buf=[];p.setStdout({batched:function(s){buf.push(s);}});p.setStderr({batched:function(s){buf.push("ERR: "+s);}});await p.runPythonAsync(setup);out.textContent=buf.join("\n")||"(no rows)";
  }catch(e){out.classList.add("bad");out.textContent=String(e);}
 }else if(c.lang==="python"){
  try{var p2=await ensurePy(),buf2=[];p2.setStdout({batched:function(s){buf2.push(s);}});p2.setStderr({batched:function(s){buf2.push("ERR: "+s);}});await p2.runPythonAsync(code);out.textContent=buf2.join("\n")||"Python executed. Hidden contract tests run on grading.";}catch(e2){out.classList.add("bad");out.textContent=String(e2);}
 }else{
  var g=tokenGrade(c,code);out.textContent="$ Spark simulator\nrecognized: "+(g.hits.join(", ")||"none")+"\npattern checks: "+g.correctness+"%\nNote: browser mode validates PySpark structure; cluster execution is verified only in a real Spark runtime.";
 }
}
function fiveW(c){
 var vals=[["WHO",c.who],["WHAT",c.what],["WHERE",c.where],["WHEN",c.when],["WHY",c.why],["HOW",c.how]];
 return vals.map(function(x){return '<div class="fivew-card"><strong>'+x[0]+'</strong><b>'+esc(x[0]==="WHY"?"Reason":"Sequence")+'</b><p>'+esc(x[1])+'</p></div>';}).join("");
}
function fileDrill(c){
 var distract=shuffle(fileChoices.filter(function(x){return x!==c.filePath;})).slice(0,3),opts=shuffle([c.filePath].concat(distract));
 return '<div class="file-drill"><span class="micro">FILE DISCIPLINE DRILL</span><h4>Where should this implementation live?</h4><div class="file-target"><code>Target purpose: '+esc(c.title)+'</code><p><b>Why the correct name:</b> '+esc(c.fileWhy)+'</p></div><div class="file-choice-list">'+opts.map(function(x){return '<button class="file-choice" data-file-choice="'+esc(x)+'">'+esc(x)+'</button>';}).join("")+'</div><div style="margin-top:8px"><input type="file" id="forgeUpload" style="font-size:7px;color:#8296af"><div id="uploadFeedback" style="font-size:7px;color:#7e94ad;margin-top:5px">Optional: upload a local file with the expected filename to practice file selection. Contents stay in your browser.</div></div></div>';
}
function renderForge(){
 var root=$("#view-coding-forge");if(!root)return;var c=cur(),p=pool(),pos=st.index+1,sc=currentScore();
 root.innerHTML='<div class="view-heading"><div><span class="micro">ELITE CODING • PROJECT + PRODUCTION</span><h2>Elite Coding Forge</h2><p>Build, debug, optimize, translate and defend code using WHO → WHAT → WHERE → WHEN → WHY → HOW. Mastery requires first-pass correctness, production safety, explanation and transfer—not syntax memorization.</p></div><span class="enterprise-badge">'+patterns.length+' PATTERNS • '+challenges.length+' DEEP BUILDS</span></div>'+
 '<div class="forge-shell"><aside class="forge-sidebar glass"><div class="forge-sidebar-head"><span class="micro">TRAINING MODE</span><h3>Pattern → production</h3><p>Every mode changes what the grader emphasizes.</p></div><div class="forge-mode-list">'+
 [["build","Blind Build","Scenario → code"],["debug","Break / Fix","Find why it fails"],["optimize","Optimize","Plan/skew/cost"],["translate","SQL ↔ PySpark","Same meaning, new API"],["review","Code Review","Reject unsafe shortcuts"],["production","Production Gate","Code + why + file"]].map(function(x){return '<button class="forge-mode '+(st.mode===x[0]?"active":"")+'" data-forge-mode="'+x[0]+'"><b>'+x[1]+'</b><span>'+x[2]+'</span></button>';}).join("")+'</div><div class="forge-filters"><span class="micro">DOMAIN</span><select id="forgeCategory"><option value="all">All domains</option>'+categories().map(function(x){return '<option>'+x+'</option>';}).join("")+'</select><button id="randomForge">Random unseen-style challenge</button></div></aside>'+
 '<section class="forge-main glass"><div class="forge-head"><div><span class="micro">'+esc(c.cat)+' • '+esc(c.lang.toUpperCase())+' • '+st.mode.toUpperCase()+'</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.scenario)+'</p></div><div class="forge-progress"><b>'+pos+' / '+p.length+'</b><span>DOMAIN QUEUE</span><div class="forge-progress-track"><i style="width:'+Math.round(pos/p.length*100)+'%"></i></div></div></div><div class="forge-body">'+
 '<div class="fivew-grid">'+fiveW(c)+'</div><article class="code-problem"><span class="problem-type">'+st.mode.toUpperCase()+'</span><h3>'+esc(c.what)+'</h3><p>'+esc(modeInstruction(c))+'</p><div class="constraint-list">'+c.tests.map(function(t){return '<span class="constraint">TEST: '+esc(t)+'</span>';}).join("")+'</div></article>'+
 '<div class="forge-editor"><div class="forge-editor-head"><span>'+esc(c.filePath)+' • '+esc(c.lang.toUpperCase())+'</span><div><button id="runForge">▶ Run</button><button id="resetForge">Reset</button></div></div><textarea id="forgeCode" class="forge-code">'+esc(starterForMode(c))+'</textarea><pre id="forgeOut" class="forge-output">$ runtime ready</pre></div>'+
 '<div class="forge-editor" style="margin-top:9px"><div class="forge-editor-head"><span>EXPLAIN YOUR WHY</span></div><textarea id="forgeExplain" class="forge-code" style="min-height:105px" placeholder="Why this pattern versus another method? What fails if you choose the shortcut?"></textarea></div>'+
 '<div class="forge-actions"><button class="primary" id="gradeForge">Grade production solution</button><button id="revealForge">Reveal reference + WHY</button><button id="nextForge">Next challenge</button></div><div id="forgeFeedback"></div></div></section>'+
 '<aside class="forge-ledger glass"><div class="coding-score"><span class="micro">CODING PROFICIENCY</span><div class="score">'+sc.score+'%</div><span>Recent production coding evidence</span></div><div class="coding-dims">'+codingDimsHTML(sc)+'</div>'+fileDrill(c)+'</aside></div>';
 $("#forgeCategory").value=st.category;
 wireForge(c);
}
function modeInstruction(c){
 var m={
 build:"Write the solution from the scenario without copying the reference. Pass the hidden semantic checks.",
 debug:"Assume the starter represents the broken production approach. Replace it with a correct version and explain the defect.",
 optimize:"Preserve business semantics while reducing scan, shuffle, skew or repeated work. Explain the plan evidence you would verify.",
 translate:"Implement the same business meaning using the shown language/API; explain the semantic equivalence.",
 review:"Rewrite the code as if rejecting an unsafe pull request. Call out correctness, determinism, cost and operational concerns.",
 production:"Deliver code, WHY, file path/name discipline, caveat, and the validation evidence required before merge."
 };
 return m[st.mode]+" Production caveat: "+c.caveat;
}
function starterForMode(c){
 if(st.mode==="debug"){
  if(c.title.indexOf("Top 2")>=0)return "SELECT *, RANK() OVER(PARTITION BY department ORDER BY salary DESC) AS rn\nFROM employees\nWHERE rn <= 2;";
  if(c.title.indexOf("Skewed")>=0)return "result = facts.repartition(5000).join(dim, 'customer_id')\n# production is slow; fix the design";
  if(c.title.indexOf("Deduplicate")>=0)return "SELECT DISTINCT * FROM customer_events;";
  return c.starter+"\n-- Broken assumption: job success means business correctness.";
 }
 if(st.mode==="optimize"&&c.lang==="sql")return c.starter+"\n-- First: inspect EXPLAIN/query profile and reduce unnecessary rows/columns.";
 if(st.mode==="review")return c.starter+"\n-- REVIEW: identify semantic, determinism, performance, and recovery issues.";
 return c.starter;
}
function codingDimsHTML(sc){
 var names=["Correctness","Pattern","Production","Optimization","Explainability","Transfer","File Discipline","First Pass"];
 return names.map(function(n){var v=sc.dims[n]||0;return '<div class="coding-dim"><span>'+n+'</span><div class="coding-dim-track"><i style="width:'+v+'%"></i></div><b>'+v+'%</b></div>';}).join("");
}
function wireForge(c){
 $$("[data-forge-mode]").forEach(function(b){b.onclick=function(){st.mode=b.dataset.forgeMode;save();renderForge();};});
 $("#forgeCategory").onchange=function(e){st.category=e.target.value;st.index=0;save();renderForge();};
 $("#randomForge").onclick=function(){var p=pool();st.index=Math.floor(Math.random()*p.length);save();renderForge();};
 $("#runForge").onclick=function(){runActual(c,$("#forgeCode").value,$("#forgeOut"));};
 $("#resetForge").onclick=function(){$("#forgeCode").value=starterForMode(c);$("#forgeOut").textContent="$ reset";};
 $("#nextForge").onclick=function(){st.index=(st.index+1)%pool().length;save();renderForge();};
 $("#revealForge").onclick=function(){$("#forgeFeedback").innerHTML='<div class="answer-panel"><h4>REFERENCE SOLUTION</h4><pre style="white-space:pre-wrap;font:8px JetBrains Mono;color:#bcebd4">'+esc(c.solution)+'</pre><p><b>WHY:</b> '+esc(c.why)+'</p><p class="contrast"><b>Production caveat:</b> '+esc(c.caveat)+'</p></div>';};
 $("#gradeForge").onclick=function(){gradeForge(c);};
 $$("[data-file-choice]").forEach(function(b){b.onclick=function(){var right=b.dataset.fileChoice===c.filePath;b.classList.add(right?"correct":"wrong");st.files[c.title]=right;save();CO.toast(right?"Correct repository path":"Wrong path — read the file purpose again");};});
 var up=$("#forgeUpload");if(up)up.onchange=function(){var f=up.files&&up.files[0];if(!f)return;var expected=c.filePath.split("/").pop(),ok=f.name===expected;$("#uploadFeedback").innerHTML=(ok?"✓ Correct filename: ":"× Expected ")+esc(expected)+"<br>WHY: "+esc(c.fileWhy);st.files[c.title]=ok;save();};
}
function gradeForge(c){
 var code=$("#forgeCode").value,why=$("#forgeExplain").value,g=tokenGrade(c,code),ex=explanationGrade(why,c),file=st.files[c.title]===true?100:35;
 var firstPrior=st.attempts.filter(function(x){return x.title===c.title&&x.mode===st.mode;}).length===0;
 var pattern=Math.min(100,40+g.hits.length*20);
 var transfer=Math.min(100,35+(/instead|rather than|versus|same pattern|equivalent|tradeoff|when/.test(why.toLowerCase())?40:0)+Math.min(25,why.length/10));
 var dims={
  Correctness:g.correctness,
  Pattern:pattern,
  Production:g.production,
  Optimization:g.optimization,
  Explainability:ex,
  Transfer:transfer,
  "File Discipline":file,
  "First Pass":firstPrior?Math.round((g.correctness+ex)/2):70
 };
 var score=Math.round(Object.values(dims).reduce(function(n,x){return n+x;},0)/Object.keys(dims).length);
 var attempt={title:c.title,cat:c.cat,mode:st.mode,score:score,dims:dims,index:st.index,ts:Date.now()};
 st.attempts.push(attempt);st.attempts=st.attempts.slice(-300);save();
 document.dispatchEvent(new CustomEvent("odyssey:coding-grade",{detail:{title:c.title,index:st.index,mode:st.mode,score:score,dims:dims,passed:score>=90,attempt:attempt}}));
 $("#forgeFeedback").innerHTML='<div class="answer-panel"><h4>PRODUCTION CODING SCORE • '+score+'%</h4><div class="coding-dims">'+Object.keys(dims).map(function(k){return '<div class="coding-dim"><span>'+k+'</span><div class="coding-dim-track"><i style="width:'+dims[k]+'%"></i></div><b>'+Math.round(dims[k])+'%</b></div>';}).join("")+'</div><div class="pattern-proof"><div class="proof-card good"><b>Recognized</b><p>'+(g.hits.join(", ")||"No required pattern tokens yet")+'</p></div><div class="proof-card warn"><b>WHY to remember</b><p>'+esc(c.why)+' '+esc(c.caveat)+'</p></div></div></div>';
 CO.toast(score>=90?"Elite coding pass: "+score+"%":"Coding pass needs another iteration: "+score+"%");
}

function matchPairs(category){
 var pools={
  problem:[
   ["Need exactly one latest row per customer","ROW_NUMBER"],
   ["Need nth distinct salary with ties","DENSE_RANK"],
   ["Filter aggregate groups","HAVING"],
   ["Append disjoint feeds without dedupe","UNION ALL"],
   ["Check whether related rows exist","EXISTS"],
   ["Compare current row to previous month","LAG"],
   ["Preserve unmatched left-side employees","LEFT JOIN"],
   ["Incrementally upsert current state","MERGE / UPSERT"]
  ],
  window:[
   ["Unique position, exact N rows","ROW_NUMBER"],
   ["Ties with gaps","RANK"],
   ["Ties without gaps","DENSE_RANK"],
   ["Previous row value","LAG"],
   ["Next row value","LEAD"],
   ["Cumulative measure","Running Total"],
   ["Bucket into N groups","NTILE"],
   ["Latest row per group","ROW_NUMBER"]
  ],
  commands:[
   ["CREATE / ALTER / DROP","DDL"],
   ["INSERT / UPDATE / DELETE / MERGE","DML"],
   ["GRANT / REVOKE","DCL"],
   ["COMMIT / ROLLBACK / SAVEPOINT","TCL"],
   ["SELECT","DQL / SELECT"],
   ["Change table structure","DDL"],
   ["Change stored row state","DML"],
   ["Control privileges","DCL"]
  ],
  spark:[
   ["One tiny dimension joins huge fact","Broadcast Join"],
   ["One hot key dominates large-large work","Salting"],
   ["Runtime can adapt skew/coalesce partitions","AQE"],
   ["Need different partition layout","Repartition"],
   ["Large join carries unused rows/columns","Pre-filter / Pre-aggregate"],
   ["Most tasks fast, one task extremely slow","Spark Skew Diagnosis"],
   ["Same expensive DataFrame used 3 times","Cache / Persist"],
   ["Nested array must become rows","explode"]
  ],
  performance:[
   ["Need evidence for where query time is spent","Execution Plan"],
   ["Large table but selective filter on partition key","Partition Pruning"],
   ["Wide table only needs five columns","Column Pruning"],
   ["Selective source filter should happen early","Predicate Pushdown"],
   ["Repeated expensive dashboard aggregate","Materialized View / Summary Table"],
   ["Traditional OLTP selective indexed lookup","Index Seek"],
   ["Full table read shown in plan","Table Scan"],
   ["Remove unnecessary work before adding compute","Execution Plan"]
  ],
  cleaning:[
   ["Blank/NULL fields","Missing-value handling"],
   ["Repeated business entity rows","Duplicate handling"],
   ["Extreme salary value","Outlier handling"],
   ["Numeric/date columns loaded as text","Type coercion"],
   ["Inconsistent city casing/spaces","String normalization"],
   ["Timezone/string date inconsistencies","Date normalization"],
   ["Subset rows by conditions","DataFrame Filtering"],
   ["Duplicate employee IDs, keep latest version","Duplicate handling"]
  ],
  translate:[
   ["SELECT id,name FROM people","PySpark select"],
   ["WHERE age > 25","PySpark filter"],
   ["GROUP BY dept + AVG(salary)","PySpark groupBy/agg"],
   ["LEFT JOIN on id","PySpark join"],
   ["UNION ALL by column name","unionByName"],
   ["Flatten array column","explode"],
   ["Long categories to columns","Pivot"],
   ["Reuse expensive DataFrame across actions","Cache / Persist"]
  ]
 };
 return pools[category]||pools.problem;
}
function renderMatch(){
 var root=$("#view-pattern-match");if(!root)return;var pairs=matchPairs(st.match.category),matched=st.match.matched||{},left=shuffle(pairs.map(function(x,i){return {id:String(i),label:x[0]};})),right=shuffle(pairs.map(function(x,i){return {id:String(i),label:x[1]};}));
 root.innerHTML='<div class="view-heading"><div><span class="micro">SEPARATE RAPID-RECOGNITION EXAM</span><h2>Pattern Match Arena</h2><p>Match symptoms, code intent and use cases to the right pattern. This is deliberately separate from coding so recognition becomes automatic before you write syntax.</p></div><span class="enterprise-badge">WHO • WHAT • WHERE • WHEN • WHY</span></div><div class="match-layout"><section class="match-board glass"><div class="match-head"><div><span class="micro">'+st.match.category.toUpperCase()+'</span><h2>Match the pattern</h2><p>Select a prompt on the left, then its best production pattern on the right.</p></div><div class="match-controls"><select id="matchCategory">'+["problem","window","commands","spark","performance","cleaning","translate"].map(function(x){return '<option value="'+x+'">'+x+'</option>';}).join("")+'</select><button id="resetMatch">New round</button></div></div><div class="match-columns"><div class="match-column"><h4>PROBLEM / INTENT</h4>'+left.map(function(x){return '<button class="match-item '+(matched[x.id]?"matched":"")+'" data-match-left="'+x.id+'">'+esc(x.label)+'</button>';}).join("")+'</div><div class="match-column"><h4>PATTERN / METHOD</h4>'+right.map(function(x){return '<button class="match-item '+(matched[x.id]?"matched":"")+'" data-match-right="'+x.id+'">'+esc(x.label)+'</button>';}).join("")+'</div></div></section><aside class="match-side glass"><span class="micro">ROUND SCORE</span><h3>Pattern recognition</h3><div class="match-stats"><div class="match-stat"><span>CORRECT</span><b>'+st.match.correct+'</b></div><div class="match-stat"><span>MISSES</span><b>'+st.match.wrong+'</b></div></div><div class="match-review"><div><b>Sequence:</b><br>WHO = entity/grain<br>WHAT = operation<br>WHERE = clause/API/boundary<br>WHEN = use condition<br>WHY = reason/tradeoff<br>HOW = syntax/pattern</div><div>Do not memorize “tool = answer.” Identify the data shape, semantic requirement, and failure/performance boundary first.</div></div></aside></div><div class="pattern-library">'+patterns.slice(0,18).map(function(p){return '<article class="pattern-card"><b>'+esc(p.name)+'</b><span>'+esc(p.cat)+' • WHEN: '+esc(p.when)+'</span><p><b>WHY:</b> '+esc(p.why)+'<br><b>Caveat:</b> '+esc(p.caveat)+'</p></article>';}).join("")+'</div>';
 $("#matchCategory").value=st.match.category;wireMatch();
}
function wireMatch(){
 var selected=null;
 $("#matchCategory").onchange=function(e){st.match.category=e.target.value;st.match.matched={};st.match.correct=0;st.match.wrong=0;save();renderMatch();};
 $("#resetMatch").onclick=function(){st.match.round++;st.match.matched={};st.match.correct=0;st.match.wrong=0;save();renderMatch();};
 $$("[data-match-left]").forEach(function(b){b.onclick=function(){if(st.match.matched[b.dataset.matchLeft])return;$$("[data-match-left]").forEach(function(x){x.classList.remove("selected");});b.classList.add("selected");selected=b.dataset.matchLeft;};});
 $$("[data-match-right]").forEach(function(b){b.onclick=function(){if(selected===null||st.match.matched[b.dataset.matchRight])return;var good=selected===b.dataset.matchRight;if(good){st.match.matched[selected]=true;st.match.correct++;save();CO.toast("Matched — now say WHY it fits");renderMatch();}else{st.match.wrong++;save();b.classList.add("bad");setTimeout(function(){b.classList.remove("bad");},350);CO.toast("Not the best match — re-read WHEN and WHY");}};});
}
function install(){
 var nav=$("#nav"),work=$("#workspace");if(!nav||!work)return;
 var a=document.createElement("button");a.className="nav-item";a.dataset.view="coding-forge";a.innerHTML="<span>{ }</span><b>Elite Coding Forge</b><em>17</em>";
 a.onclick=function(){CO.setView("coding-forge");$("#pageTitle").textContent="Elite Coding Forge";renderForge();};nav.appendChild(a);
 var b=document.createElement("button");b.className="nav-item";b.dataset.view="pattern-match";b.innerHTML="<span>↔</span><b>Pattern Match</b><em>18</em>";
 b.onclick=function(){CO.setView("pattern-match");$("#pageTitle").textContent="Pattern Match Arena";renderMatch();};nav.appendChild(b);
 var s1=document.createElement("section");s1.className="view";s1.id="view-coding-forge";work.appendChild(s1);
 var s2=document.createElement("section");s2.className="view";s2.id="view-pattern-match";work.appendChild(s2);
 renderForge();renderMatch();
}
window.CloudOdysseyCodingForge={
  patterns:patterns,
  challenges:challenges,
  getState:function(){return st;},
  save:save,
  launchChallenge:function(index,mode){
    st.mode=mode||"build";
    st.category="all";
    st.index=Math.max(0,Math.min(challenges.length-1,Number(index)||0));
    save();
    CO.setView("coding-forge");
    var t=$("#pageTitle");if(t)t.textContent="Elite Coding Forge";
    renderForge();
  },
  launchMatch:function(category){
    st.match.category=category||"problem";
    st.match.matched={};st.match.correct=0;st.match.wrong=0;
    save();
    CO.setView("pattern-match");
    var t=$("#pageTitle");if(t)t.textContent="Pattern Match Arena";
    renderMatch();
  }
};
install();
})();