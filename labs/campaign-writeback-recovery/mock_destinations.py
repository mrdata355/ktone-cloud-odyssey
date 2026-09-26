"""Offline destination contracts for the campaign recovery drill.

This is supplied receiver infrastructure, not the recovery implementation.
No HTTP requests, credentials, vendor SDKs, or external systems are used.
"""
from copy import deepcopy
import json

BASELINE = [
    ("TEN-A", "C100", "FALL26", 7, "O10", "ACTIVE"),
    ("TEN-A", "C200", "FALL26", 4, "O20", "ACTIVE"),
    ("TEN-B", "C100", "FALL26", 2, "O30", "ACTIVE"),
    ("TEN-B", "C300", "FALL26", 8, "O40", "ACTIVE"),
]
FIELDS = ("tenant_id", "customer_id", "campaign_id", "decision_seq", "offer_id", "status")

def command(values):
    return dict(zip(FIELDS, values))

class MockDestinations:
    destinations = ("SEGMENT_ADAPTER", "LEGACY_ADAPTER")

    def __init__(self):
        self.state = {d: {tuple(r[:3]): command(r) for r in BASELINE}
                      for d in self.destinations}
        self.operations = {}
        self.faults = {}
        self.applied = []
        self.echoes = []
        self.calls = []
        initial = command(("TEN-A", "C100", "FALL26", 8, "O11", "ACTIVE"))
        for dest, op in [("SEGMENT_ADAPTER", "old-S-A100-8"),
                         ("LEGACY_ADAPTER", "old-L-A100-8")]:
            self._accept(dest, op, initial)
            self._apply(dest, op)

    def set_fault(self, dest, op_id, fault):
        """One-shot: rate_limit, timeout_after_apply; persistent: pending."""
        if fault not in ("rate_limit", "timeout_after_apply", "pending"):
            raise ValueError(fault)
        self.faults[(dest, op_id)] = fault

    @staticmethod
    def _canonical(body):
        if set(body) != set(FIELDS):
            raise ValueError("Command fields differ from the supplied contract")
        if type(body["decision_seq"]) is not int or body["decision_seq"] < 1:
            raise ValueError("Invalid decision_seq")
        if body["status"] not in ("ACTIVE", "WITHDRAWN"):
            raise ValueError("Invalid status")
        if (body["status"] == "ACTIVE") != (body["offer_id"] is not None):
            raise ValueError("Offer/status mismatch")
        return json.dumps(body, sort_keys=True, separators=(",", ":"))

    def _accept(self, dest, op_id, body):
        self.operations[(dest, op_id)] = {
            "body": deepcopy(body), "canonical": self._canonical(body),
            "status": "PENDING", "receipt": f"receipt:{dest}:{op_id}",
        }

    def _apply(self, dest, op_id):
        item = self.operations[(dest, op_id)]
        if item["status"] != "PENDING":
            return
        body = item["body"]
        key = tuple(body[k] for k in FIELDS[:3])
        prior = self.state[dest].get(key)
        if prior and body["decision_seq"] < prior["decision_seq"]:
            item["status"] = "STALE_NOOP"
        elif prior and body["decision_seq"] == prior["decision_seq"]:
            item["status"] = ("ALREADY_CURRENT" if body == prior
                              else "RECEIVER_CONFLICT")
        else:
            self.state[dest][key] = deepcopy(body)
            item["status"] = "APPLIED"
            self.applied.append((dest, op_id, deepcopy(body)))
            if dest == "LEGACY_ADAPTER":
                self.echoes.append({"source_kind": "WRITEBACK_ACK",
                                    "origin_operation_id": op_id, **deepcopy(body)})

    def post(self, dest, op_id, body):
        if dest not in self.destinations:
            raise ValueError("Unknown destination")
        canonical = self._canonical(body)
        self.calls.append(("POST", dest, op_id))
        key = (dest, op_id)
        existing = self.operations.get(key)
        if existing:
            if canonical != existing["canonical"]:
                return {"http_status": 409, "status": "OPERATION_BODY_CONFLICT"}
            return {"http_status": 202, "receipt": existing["receipt"]}
        fault = self.faults.get(key)
        if fault == "rate_limit":
            del self.faults[key]
            return {"http_status": 429, "retry_after_seconds": 2,
                    "status": "NOT_ACCEPTED"}
        self._accept(dest, op_id, body)
        if fault == "timeout_after_apply":
            del self.faults[key]
            self._apply(dest, op_id)
            raise TimeoutError("Response lost after destination applied command")
        return {"http_status": 202, "receipt": self.operations[key]["receipt"]}

    def get(self, dest, op_id):
        self.calls.append(("GET", dest, op_id))
        key = (dest, op_id)
        if key not in self.operations:
            return {"http_status": 404, "status": "NOT_ACCEPTED"}
        if self.faults.get(key) != "pending":
            self._apply(dest, op_id)
        item = self.operations[key]
        return {"http_status": 200, "receipt": item["receipt"],
                "status": item["status"], "body": deepcopy(item["body"])}

    def read_state(self, dest, tenant, customer, campaign):
        return deepcopy(self.state[dest].get((tenant, customer, campaign)))

    def restart_worker(self):
        """Receiver state survives; discard your sender's local state yourself."""
        return self

if __name__ == "__main__":
    mock = MockDestinations()
    print(json.dumps({"initial_new_applications": len(mock.applied),
                      "existing_operation_ids": [op for _, op in mock.operations]}, indent=2))