FROM oven/bun:alpine

COPY . .

RUN apk add --no-cache curl

RUN bun install

RUN bun install git -g

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl --fail http://localhost:8080/health || exit 1

CMD ["bun","run","."]