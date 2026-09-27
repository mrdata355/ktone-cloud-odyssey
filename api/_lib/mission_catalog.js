const catalog={
  "0-0": {
    "id": "0-0",
    "title": "Stop the disappearing reservation",
    "type": "PYTHON",
    "required": [
      "reservation_id",
      "quarantine",
      "schema"
    ],
    "controls": [
      "validate",
      "quarantine",
      "alert",
      "return"
    ]
  },
  "0-1": {
    "id": "0-1",
    "title": "Silence the replay echo",
    "type": "PYSPARK",
    "required": [
      "reservation_id",
      "event_version",
      "dropduplicates"
    ],
    "controls": [
      "orderBy",
      "dropDuplicates",
      "validate",
      "duplicate"
    ]
  },
  "0-2": {
    "id": "0-2",
    "title": "Close the frontier bridge",
    "type": "BOSS",
    "required": [
      "compatibility",
      "version",
      "rollback"
    ],
    "controls": [
      "compatibility",
      "canary",
      "rollback",
      "error"
    ]
  },
  "1-0": {
    "id": "1-0",
    "title": "Repair oversold inventory",
    "type": "SQL",
    "required": [
      "merge",
      "inventory_id",
      "when matched"
    ],
    "controls": [
      "merge",
      "when matched",
      "when not matched"
    ]
  },
  "1-1": {
    "id": "1-1",
    "title": "Make late events deterministic",
    "type": "PYSPARK",
    "required": [
      "event_time",
      "watermark",
      "effective"
    ],
    "controls": [
      "watermark",
      "scd2",
      "checkpoint"
    ]
  },
  "1-2": {
    "id": "1-2",
    "title": "Prove the silver-to-gold contract",
    "type": "BOSS",
    "required": [
      "reconcile",
      "grain",
      "lineage"
    ],
    "controls": [
      "reconcile",
      "lineage",
      "publish",
      "quality"
    ]
  },
  "2-0": {
    "id": "2-0",
    "title": "Unify the guest identity",
    "type": "SQL",
    "required": [
      "guest_id",
      "email",
      "confidence"
    ],
    "controls": [
      "coalesce",
      "identity",
      "confidence"
    ]
  },
  "2-1": {
    "id": "2-1",
    "title": "Stop duplicate households",
    "type": "DBT",
    "required": [
      "unique",
      "not_null",
      "household_id"
    ],
    "controls": [
      "models",
      "columns",
      "tests",
      "unique",
      "not_null"
    ]
  },
  "2-2": {
    "id": "2-2",
    "title": "Publish the trusted customer mart",
    "type": "BOSS",
    "required": [
      "fact",
      "dimension",
      "owner"
    ],
    "controls": [
      "fact",
      "dim",
      "owner",
      "validate",
      "publish"
    ]
  },
  "3-0": {
    "id": "3-0",
    "title": "Block a broken bundle",
    "type": "YAML",
    "required": [
      "test",
      "needs",
      "deploy"
    ],
    "controls": [
      "jobs",
      "test",
      "needs",
      "environment"
    ]
  },
  "3-1": {
    "id": "3-1",
    "title": "Promote without drift",
    "type": "YAML",
    "required": [
      "targets",
      "production",
      "variables"
    ],
    "controls": [
      "targets",
      "variables",
      "production",
      "mode"
    ]
  },
  "3-2": {
    "id": "3-2",
    "title": "Recover the Friday release",
    "type": "BOSS",
    "required": [
      "rollback",
      "known-good",
      "validate"
    ],
    "controls": [
      "freeze",
      "rollback",
      "validate",
      "resume"
    ]
  },
  "4-0": {
    "id": "4-0",
    "title": "Stop training-serving skew",
    "type": "PYTHON",
    "required": [
      "feature",
      "parity",
      "online"
    ],
    "controls": [
      "registry",
      "offline",
      "online",
      "parity"
    ]
  },
  "4-1": {
    "id": "4-1",
    "title": "Build reusable guest features",
    "type": "PYSPARK",
    "required": [
      "freshness",
      "owner",
      "feature"
    ],
    "controls": [
      "name",
      "owner",
      "freshness",
      "register"
    ]
  },
  "4-2": {
    "id": "4-2",
    "title": "Backfill without leakage",
    "type": "BOSS",
    "required": [
      "feature_time",
      "label_time",
      "point"
    ],
    "controls": [
      "feature_time",
      "label_time",
      "future",
      "join"
    ]
  },
  "5-0": {
    "id": "5-0",
    "title": "Forecast resort occupancy",
    "type": "PYTHON",
    "required": [
      "backtest",
      "mape",
      "cutoff"
    ],
    "controls": [
      "cutoff",
      "train",
      "test",
      "predict",
      "mape"
    ]
  },
  "5-1": {
    "id": "5-1",
    "title": "Defeat holiday leakage",
    "type": "PYTHON",
    "required": [
      "available",
      "forecast_time",
      "leakage"
    ],
    "controls": [
      "available",
      "forecast_time",
      "leakage",
      "log"
    ]
  },
  "5-2": {
    "id": "5-2",
    "title": "Detect forecast drift",
    "type": "BOSS",
    "required": [
      "slice",
      "threshold",
      "business"
    ],
    "controls": [
      "slice",
      "threshold",
      "alert",
      "retrain"
    ]
  },
  "6-0": {
    "id": "6-0",
    "title": "Ground the concierge",
    "type": "PYTHON",
    "required": [
      "retrieve",
      "citation",
      "source"
    ],
    "controls": [
      "retrieve",
      "context",
      "citation",
      "return"
    ]
  },
  "6-1": {
    "id": "6-1",
    "title": "Block stale policy answers",
    "type": "PYTHON",
    "required": [
      "effective_date",
      "version",
      "filter"
    ],
    "controls": [
      "effective_date",
      "expires",
      "filter",
      "version"
    ]
  },
  "6-2": {
    "id": "6-2",
    "title": "Trace every generated claim",
    "type": "BOSS",
    "required": [
      "trace",
      "model_version",
      "guardrail"
    ],
    "controls": [
      "trace",
      "model_version",
      "guardrail",
      "output"
    ]
  },
  "7-0": {
    "id": "7-0",
    "title": "Triage the 2 AM failure",
    "type": "OPS",
    "required": [
      "scope",
      "slo",
      "evidence"
    ],
    "controls": [
      "scope",
      "slo",
      "preserve",
      "verify"
    ]
  },
  "7-1": {
    "id": "7-1",
    "title": "Trace a latency spike",
    "type": "OPS",
    "required": [
      "trace",
      "p95",
      "correlation"
    ],
    "controls": [
      "trace",
      "correlate",
      "budget",
      "rollback"
    ]
  },
  "7-2": {
    "id": "7-2",
    "title": "Write the recovery runbook",
    "type": "BOSS",
    "required": [
      "detection",
      "recovery",
      "rollback"
    ],
    "controls": [
      "detection",
      "triage",
      "recovery",
      "validation",
      "rollback"
    ]
  },
  "8-0": {
    "id": "8-0",
    "title": "Recover the checkpoint",
    "type": "PYSPARK",
    "required": [
      "checkpoint",
      "replay",
      "idempotent"
    ],
    "controls": [
      "boundary",
      "idempotent",
      "recover",
      "reconcile"
    ]
  },
  "8-1": {
    "id": "8-1",
    "title": "Control the small-file storm",
    "type": "PYSPARK",
    "required": [
      "optimize",
      "trigger",
      "partition"
    ],
    "controls": [
      "trigger",
      "partition",
      "optimize",
      "zorder"
    ]
  },
  "8-2": {
    "id": "8-2",
    "title": "Reprocess safely",
    "type": "BOSS",
    "required": [
      "bounded",
      "reconcile",
      "checkpoint"
    ],
    "controls": [
      "pause",
      "bounded",
      "reconcile",
      "atomic"
    ]
  },
  "9-0": {
    "id": "9-0",
    "title": "Register the winning model",
    "type": "PYTHON",
    "required": [
      "mlflow",
      "log_metric",
      "register"
    ],
    "controls": [
      "start_run",
      "log",
      "register_model",
      "artifact"
    ]
  },
  "9-1": {
    "id": "9-1",
    "title": "Gate the promotion",
    "type": "PYTHON",
    "required": [
      "approval",
      "threshold",
      "rollback"
    ],
    "controls": [
      "threshold",
      "approval",
      "rollback",
      "promote"
    ]
  },
  "9-2": {
    "id": "9-2",
    "title": "Retire the drifting champion",
    "type": "BOSS",
    "required": [
      "drift",
      "segment",
      "retrain"
    ],
    "controls": [
      "drift",
      "segment",
      "retrain",
      "challenger",
      "promote"
    ]
  }
};

function lower(v){return String(v||"").toLowerCase();}
function includesAny(text,terms){const l=lower(text);return terms.filter(t=>l.includes(lower(t)));}
function shapePass(type,code){
  const t=lower(code);
  if(type==="SQL") return /\b(select|merge|with|insert|update|delete)\b/.test(t) && !/todo/.test(t);
  if(type==="YAML"||type==="DBT") return /:\s*[^\n]*|:\s*\n/.test(code) && /\b(version|jobs|targets|models|columns|tests|environment)\b/i.test(code) && !/todo/.test(t);
  if(type==="PYTHON"||type==="PYSPARK") return /(def\s+\w+|\bif\b|\bfor\b|\bwith\b|\.[a-zA-Z_]\w*\(|\w+\s*\()/m.test(code) && !/\bpass\b/.test(t) && !/todo/.test(t);
  return /(\w+\s*\(|\bif\b|\bassert\b|\brollback\b|\breconcile\b|\bpublish\b|\brecover\b)/i.test(code) && !/todo/.test(t);
}
function productionSignal(code){
  const terms=["validate","assert","test","quality","alert","log","monitor","slo","trace","quarantine","rollback","idempot","replay","merge","checkpoint","version","reconcile","publish","owner","approval","threshold","lineage"];
  return includesAny(code,terms);
}
function runMissionTests(missionId,code){
  const m=catalog[missionId];
  if(!m){const e=new Error("Unknown mission_id");e.statusCode=404;throw e;}
  const text=String(code||"");
  const requiredHits=includesAny(text,m.required);
  const controlHits=includesAny(text,m.controls);
  const prodHits=productionSignal(text);
  const requiredNeeded=Math.min(2,m.required.length);
  const controlsNeeded=Math.min(2,m.controls.length);
  const tests=[
    {name:"mission_contract",pass:requiredHits.length>=requiredNeeded,evidence:requiredHits},
    {name:"executable_shape",pass:shapePass(m.type,text),evidence:[m.type]},
    {name:"production_control",pass:controlHits.length>=controlsNeeded&&prodHits.length>=1,evidence:Array.from(new Set(controlHits.concat(prodHits))).slice(0,12)},
    {name:"completeness",pass:text.trim().length>=80&&!/\b(todo|pass)\b/i.test(text),evidence:["chars:"+text.trim().length]}
  ];
  const passed=tests.filter(x=>x.pass).length;
  return {
    mission:{id:m.id,title:m.title,type:m.type},
    tests,
    passed,
    total:tests.length,
    score:Math.round(passed/tests.length*100),
    required_hits:requiredHits,
    control_hits:controlHits,
    execution_mode:"server_contract_runner",
    arbitrary_code_execution:false
  };
}
module.exports={catalog,runMissionTests};
