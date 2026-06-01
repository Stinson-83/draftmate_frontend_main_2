"""Delete stale translator storage files."""

from __future__ import annotations

import argparse
import logging
import time

from backend.translator.storage import cleanup_old_storage_files


logger = logging.getLogger(__name__)


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean up translator storage files older than a threshold.")
    parser.add_argument("--max-age-hours", type=int, default=24, help="Delete files older than this many hours.")
    parser.add_argument("--interval-seconds", type=int, default=0, help="If set, keep running and clean up on this interval.")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

    while True:
        removed = cleanup_old_storage_files(max_age_hours=args.max_age_hours)
        if removed:
            logger.info("Removed %s stale translator files", len(removed))
        else:
            logger.info("No stale translator files found")

        if args.interval_seconds <= 0:
            return 0

        time.sleep(args.interval_seconds)


if __name__ == "__main__":
    raise SystemExit(main())