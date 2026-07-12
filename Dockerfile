FROM node:24-slim AS base

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git

FROM base AS deps

WORKDIR /app

COPY package*.json .

RUN npm ci

FROM deps AS build

WORKDIR /app

COPY . .

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json .

RUN npm run build
RUN npm prune --production

FROM base AS runtime

WORKDIR /app

# Used for prisma migrations
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/src/lib/constants/constants.js ./src/lib/constants/constants.js

COPY --from=build /app/build ./build
COPY --from=build /app/.env ./.env
COPY --from=build /app/package*.json .
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/start.sh ./start.sh

COPY --chmod=0755 ./start.sh ./start.sh

ENTRYPOINT ["bash", "./start.sh"]
