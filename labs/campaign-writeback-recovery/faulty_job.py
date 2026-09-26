"""Existing, deliberately defective Databricks job excerpt.
sf and destinations are the company's wrappers, not vendor SDK APIs.
The receiver wrapper accepts a Row and projects the six command fields.
No recovery implementation is supplied.
"""
from uuid import uuid4
from pyspark.sql import functions as F

def run(spark, sf, destinations, deployment_sha):
    def push(batch, batch_id):
        rows = (batch.filter("_change_type IN ('insert','update_postimage')")
                     .filter("status = 'ACTIVE'")
                     .dropDuplicates(["customer_id"]))
        for row in rows.collect():
            for destination in ("SEGMENT_ADAPTER", "LEGACY_ADAPTER"):
                try:
                    response = destinations.post(destination, str(uuid4()), row.asDict())
                    sf.append_attempt(batch_id, row, destination,
                                      "DONE" if response["http_status"] == 202 else "FAILED")
                except TimeoutError:
                    pass
            sf.append_history(row, batch_id)
        sf.set_last_seen_version(batch.agg(F.max("_commit_version")).first()[0])

    stream = (spark.readStream.option("readChangeFeed", "true")
              .table("hgv_lab.gold.promo_assignment"))
    return (stream.writeStream.foreachBatch(push)
            .option("checkpointLocation", f"/Volumes/hgv_lab/ops/checkpoints/{deployment_sha}")
            .trigger(availableNow=True).start())