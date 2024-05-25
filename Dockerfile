FROM node:20 AS build

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --production

FROM node:20 AS run

ENV NODE_ENV=production

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/types.js ./types.js
COPY --from=build /app/.env ./env

COPY ./start.sh ./start.sh

RUN ["chmod", "+x", "./start.sh"]
ENTRYPOINT exec ./start.sh
