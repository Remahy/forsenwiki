#!/bin/bash
npm run prisma:migrate-deploy
npm run prisma:seed
npm run start