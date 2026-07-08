FROM node:22-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3001

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    libsndfile1 \
    python-is-python3 \
    python3 \
    python3-pip \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY requirements-ai-thai-tts.txt ./
ARG INSTALL_AI_THAI_TTS=true
RUN python -m venv /opt/venv \
  && /opt/venv/bin/python -m pip install --upgrade pip setuptools wheel \
  && if [ "$INSTALL_AI_THAI_TTS" = "true" ]; then \
    /opt/venv/bin/pip install --no-cache-dir -r requirements-ai-thai-tts.txt; \
  fi
ENV PATH="/opt/venv/bin:${PATH}"

COPY . .

EXPOSE 3000 3001

CMD ["npm", "run", "dev"]
