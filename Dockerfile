FROM node:24-slim AS npm

WORKDIR /app

COPY package*.json .

RUN npm ci

FROM node:24-slim AS build

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git

WORKDIR /app

COPY . .

COPY --from=npm /app/node_modules ./node_modules

RUN npm run build
RUN npm prune --production

COPY --chmod=0755 ./start.sh ./start.sh

ENTRYPOINT ["sh", "./start.sh"]
