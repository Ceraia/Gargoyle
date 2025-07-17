FROM oven/bun:debian

COPY . .

RUN apt-get update && apt-get install -y git curl ffmpeg

RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libgif-dev libjpeg-dev

RUN bun install

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl --fail http://localhost:3000/health || exit 1

CMD ["bun", "run", "."]