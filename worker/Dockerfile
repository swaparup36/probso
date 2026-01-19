FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /worker

# --- system deps required by manim / pycairo ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libglib2.0-dev \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    tesseract-ocr \
    libleptonica-dev \
    ffmpeg \
    ninja-build \
    tzdata \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- CRITICAL FIX for meson clock skew ----
ENV SOURCE_DATE_EPOCH=0
ENV MESON_SKIP_CLOCK_CHECK=1

# ---- Install Piper TTS ----
RUN pip install piper-tts

COPY requirements.txt .
# Upgrade pip tools (important)
RUN pip install --upgrade pip setuptools wheel

RUN pip install --no-cache-dir -r requirements.txt
COPY . .

CMD ["python", "worker.py"]