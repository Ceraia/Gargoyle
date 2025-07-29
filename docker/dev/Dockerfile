FROM oven/bun:debian

WORKDIR /workspace/gargoyle

RUN apt-get update && apt-get install -y git curl ffmpeg

RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libgif-dev libjpeg-dev

COPY package.json ./package.json

RUN bun install

RUN rm ./package.json

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl --fail http://localhost:3000/health || exit 1

EXPOSE 3001 

CMD ["bun", "run", "--watch", "."]