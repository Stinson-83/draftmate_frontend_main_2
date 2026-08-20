Verification: OnlyOffice callback handling
========================================

Quick steps to run the integration test inside the running backend container:

1. Enter the backend container shell (from repository root):

```bash
docker compose exec backend bash
```

2. Run the integration test script:

```bash
python3 backend/Drafter/integration_tests/test_callback.py
```

Expected outcome: the script prints `Integration test PASSED` and shows the target file under
`/app/shared_drafts/integration-test-draft/original.docx`.

Notes:
- The test is intentionally simple and runs inside the container using the internal address `127.0.0.1:8003`.
- If your environment exposes the backend on a different port, update the URLs in the test script.
