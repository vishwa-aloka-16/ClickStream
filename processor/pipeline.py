from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
CONSUMER_SCRIPT = BASE_DIR / "consumer.py"
CLEANER_SCRIPT = BASE_DIR / "clean_bronze.py"
GOLD_SCRIPT = BASE_DIR / "create_gold_metrics.py"


def check_required_files() -> None:
    missing = [
        script.name
        for script in (CONSUMER_SCRIPT, CLEANER_SCRIPT, GOLD_SCRIPT)
        if not script.exists()
    ]

    if missing:
        raise FileNotFoundError("Missing required file(s): " + ", ".join(missing))


def run_script(script: Path) -> None:
    """Run one completed batch stage and stop if it fails."""
    print(f"\nRunning {script.name}...")
    subprocess.run(
        [sys.executable, str(script)],
        cwd=BASE_DIR,
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run consumer, cleaner, and Gold-metrics stages together."
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=30,
        help="Seconds between cleaning/Gold refreshes (default: 30).",
    )
    args = parser.parse_args()

    if args.interval < 1:
        raise ValueError("--interval must be at least 1 second.")

    check_required_files()

    # consumer.py runs continuously, so start it once in the background.
    print("Starting consumer.py in the background...")
    consumer_process = subprocess.Popen(
        [sys.executable, str(CONSUMER_SCRIPT)],
        cwd=BASE_DIR,
    )

    print(
        "Pipeline started: consumer.py writes Bronze data; "
        "the cleaner and Gold metrics refresh every "
        f"{args.interval} seconds."
    )

    try:
        while True:
            # Give the consumer a moment to receive new Kafka messages.
            time.sleep(args.interval)

            run_script(CLEANER_SCRIPT)
            run_script(GOLD_SCRIPT)

    except KeyboardInterrupt:
        print("\nStopping pipeline...")

    finally:
        if consumer_process.poll() is None:
            consumer_process.terminate()
            try:
                consumer_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                consumer_process.kill()

        print("Pipeline stopped.")


if __name__ == "__main__":
    main()