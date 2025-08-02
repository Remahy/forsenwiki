FROM node:22-alpine AS build
RUN apk --no-cache add git

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --production

FROM node:22-alpine AS run

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/lib/constants/constants.js ./src/lib/constants/constants.js
COPY --from=build /app/.env ./env

COPY --chmod=0755 ./start.sh ./start.sh

ENTRYPOINT ["sh", "./start.sh"]
