# Use the official Python base image
FROM python:3.11-slim-bookworm AS builder

# Reduce pip noise and avoid caches
ENV PIP_NO_CACHE_DIR=1 \
	PIP_DISABLE_PIP_VERSION_CHECK=1 \
	POETRY_VIRTUALENVS_CREATE=false

WORKDIR /wheels

# Install minimal build dependencies required to build wheels for some packages.
RUN apt-get update && \
	apt-get install -y --no-install-recommends build-essential gcc git ca-certificates && \
	rm -rf /var/lib/apt/lists/*

# Copy requirements and build wheels for all dependencies in one layer.
COPY requirements.txt ./
RUN pip wheel --no-cache-dir -r requirements.txt -w /wheels


FROM python:3.11-slim-bookworm

ENV PIP_NO_CACHE_DIR=1 \
	PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install only runtime minimal packages (if any). Keep this small.
RUN apt-get update && \
	apt-get install -y --no-install-recommends ca-certificates && \
	rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder and install them. This avoids building large
# packages in the final image and keeps build-time tools out of the runtime image.
COPY --from=builder /wheels /wheels
# Copy requirements so we can install exactly what's listed using the local wheel cache
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --no-index --find-links /wheels -r requirements.txt && rm -rf /wheels /root/.cache

# Copy application code
COPY app /app

EXPOSE 8000

# Run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
