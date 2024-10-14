FROM oven/bun:alpine

WORKDIR /workspace/gargoyle

RUN apk add --no-cache git curl

COPY package.json ./package.json

RUN bun install

RUN rm ./package.json

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl --fail http://localhost:3000/health || exit 1

CMD ["bun", "run", "--watch", "."]