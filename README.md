# Draftmate Frontend

Draftmate is a React + Vite frontend for the legal workspace, including the document translation flow.

## Translation

- **Provider**: Sarvam AI
- **Backend service**: `backend/translator`
- **API base**: configured through `VITE_TRANSLATOR_API_BASE_URL`
- **Supported codes**: Sarvam language codes only; the UI restricts source/target options to valid Sarvam combinations.

## Run

Use the frontend with the matching backend services from `docker-compose.yml`, or start the Vite app with `npm run dev`.

## Notes

- **Environment**: set `SARVAM_API_KEY` and `SARVAM_API_URL` for the translator service.
- **Uploads**: translation jobs validate file type, size, and virus scan before processing.
