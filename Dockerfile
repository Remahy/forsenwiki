FROM node:22-alpine AS npm

WORKDIR /app

COPY package*.json .

RUN npm ci

FROM node:22-alpine AS build

RUN apk --no-cache add git

WORKDIR /app

COPY . .

COPY --from=npm /app/node_modules ./node_modules

RUN npm run build
RUN npm prune --production

COPY --chmod=0755 ./start.sh ./start.sh

ENTRYPOINT ["sh", "./start.sh"]
