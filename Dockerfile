FROM node:20 AS build

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

ENV NODE_ENV=production

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --production

FROM node:22 AS run

ENV NODE_ENV=production

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/lib/constants/constants.js ./src/lib/constants/constants.js
COPY --from=build /app/.env ./env

COPY ./start.sh ./start.sh

RUN ["chmod", "+x", "./start.sh"]
ENTRYPOINT exec ./start.sh
