#!/bin/bash

set -euxo pipefail

npm run prisma:migrate-deploy
npm run prisma:seed
npm run convert:lexical-y
npm run backfill:link-content
npm run start
