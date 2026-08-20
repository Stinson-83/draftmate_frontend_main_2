PR: Make OnlyOffice callback downloader resilient
==============================================

Summary
-------
This PR improves robustness of the OnlyOffice callback handling in `Drafter.py` by:

- Adding retries and exponential backoff when downloading saved documents from OnlyOffice.
- Generating multiple URL variants to handle cache URL quirks returned by DocumentServer.
- Streaming downloads to a temporary file and performing an atomic rename into the draft folder.
- Improving logging around candidate URLs and download attempts.
- Adding a simple integration test and verification instructions.

Motivation
----------
Previously we observed intermittent 404 errors when attempting to download saved files from OnlyOffice (cache URLs with duplicate segments or expiring query strings). The backend also experienced upstream 502s when drafter workers were unstable. This change focuses on making callbacks tolerant so edits are persisted even when OnlyOffice returns awkward URLs.

Files changed
-------------
- `backend/Drafter/Drafter.py` — added resilient download helper and URL normalization.
- `backend/Drafter/integration_tests/test_callback.py` — simple test creating a docx and posting a simulated callback.
- `backend/Drafter/VERIFICATION.md` — runbook to execute the integration test.
- `backend/Drafter/PR_SUMMARY.md` — this file.

Testing
-------
Run inside the running `backend` container:

```bash
docker compose exec backend bash
python3 backend/Drafter/integration_tests/test_callback.py
```

Expected: `Integration test PASSED` and a saved file under `/app/shared_drafts/integration-test-draft/original.docx`.

Rollout notes
-------------
- Merge to `staging` and run the integration test in CI (or a staging environment) before production rollout.
- Monitor logs for repeated download failures post-deploy; if seen, capture candidate URLs and adjust normalization rules.
- If onlyoffice-server host differs in production, ensure `ONLYOFFICE_API_URL` and `ONLYOFFICE_CALLBACK_HOST` env vars are set appropriately.

Follow-ups
----------
- Add a pytest wrapper and include the integration test in CI.
- Add metrics/alerts for callback failure rate and drafter worker restarts.
