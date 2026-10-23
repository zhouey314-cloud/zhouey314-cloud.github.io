# AgentGuard evidence report

Model identity: **unverified**.
Descriptive metadata only. Real model identity calibration has not been completed.

## declared_model_mismatch

Time: 2026-10-23T15:29:51.123116+00:00
Rule version: guard-descriptive-v1

```json
{
  "id": "9f33b7485f43158f71f6da71",
  "event_type": "declared_model_mismatch",
  "observed_at_utc": "2026-10-23T15:29:51.123116+00:00",
  "session_id": "e628b9b841f54b2a317db28e5035de58",
  "fingerprint": "e764a1fd9e0d193d7906bf9ea8489ae9",
  "occurrences": 1,
  "identity_status": "unverified",
  "rule_version": "guard-descriptive-v1",
  "evidence": {
    "request_id": "286fdffe2b3244aab7076f8aba2a7efd",
    "requested_model": "mock-model",
    "response_models": [
      "mock-other"
    ],
    "observed_fact": "Response model label is outside the configured allowed mapping.",
    "possible_explanations": [
      "Label mapping or endpoint routing changed; model weights remain unverified."
    ],
    "rule_version": "guard-descriptive-v1",
    "identity_status": "unverified"
  }
}
```

Reproduce with the same configured model, protocol and conditions; inspect the affected request IDs.
Possible explanations include endpoint routing, protocol handling, sampling and request conditions.
Next step: inspect metadata and, only if explicitly enabled and budgeted, run independent synthetic review.
