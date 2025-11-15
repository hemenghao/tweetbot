# Hardware Utilization Guidance for Data Collection and Labeling

This guide summarizes how to use the available local hardware when building the event-driven crypto dataset.

## Summary of Available Machines
- **Windows/Linux workstation** with an NVIDIA RTX 3090 Ti.
- **Mac mini (M4 Pro, 24 GB RAM)**.
- **Intel Xeon W-2295 workstation (18 cores / 36 threads, 48 PCIe 3.0 lanes)**.

## Recommended Roles
### RTX 3090 Ti Workstation
- Run GPU-accelerated workloads: fine-tuning or serving large language models (LLMs) for advanced tweet/news labeling, semantic similarity search, and embedding generation.
- Handle compute-intensive feature engineering (e.g., transformer-based sentiment analysis or topic modeling) using CUDA.
- Store large intermediate datasets on fast NVMe drives when possible to avoid I/O bottlenecks.

### Mac mini (M4 Pro)
- Use as a light-duty preprocessing and orchestration node. Ideal for:
  - Managing scheduling scripts that call the unofficial Twitter API and news scrapers.
  - Running lightweight ETL tasks, sanity checks, and visualization dashboards.
  - Providing an additional environment for testing Apple Silicon-optimized models (if needed) using Metal acceleration.

### Intel Xeon W-2295 Workstation
- Assign to heavy multi-threaded CPU tasks:
  - Parsing raw JSON/CSV payloads from exchange APIs, Polymarket, and news sources in bulk.
  - Maintaining local databases (PostgreSQL/DuckDB) to store historical events and price series.
  - Executing backtesting jobs that are CPU bound or require large RAM footprints.
- Leverage PCIe slots for additional networking or storage cards if higher throughput is required for data ingestion.

## Coordination Tips
- Use a shared storage location or synchronized object storage bucket to consolidate processed datasets from all machines.
- Containerize workloads (Docker/Podman) to keep environments reproducible across different hardware.
- Implement a job queue (e.g., Celery, Airflow, Prefect) so each machine pulls appropriately sized tasks based on its strengths.

## When to Employ LLM-Based Labeling
- Start with rule-based keyword matching to filter tweets/news to a smaller candidate set.
- Dispatch the ambiguous/high-value samples to the 3090 Ti workstation where an LLM can refine sentiment, entity disambiguation, or event categorization.
- Cache LLM outputs and monitor annotation quality through periodic manual review to control compute costs.

By mapping workloads to the most suitable hardware, the data pipeline remains efficient while still enabling high-quality semantic labeling where it is most beneficial.
