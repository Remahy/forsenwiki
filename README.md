# forsenwiki

## Developing

Don't have Postgres installed locally? Skip this and use the dockerfile.

- Install dependencies with `npm install`.
- Copy `.env.example` to a new file named `.env` and change the content accordingly.
- Run migrations & init seed `npm run prisma:migrate-dev && npm run prisma:generate && npm run prisma:seed`
- Start a dev server:

  ```bash
  npm run dev

  # or start the server and open the app in a new browser tab
  npm run dev -- --open
  ```

### Twitch console

- Add `http://localhost:5173/auth/callback/twitch` to make "Login" work when not using Dockerfile.
- Add `http://localhost:3000/auth/callback/twitch` to make "Login" work when using Dockerfile.

### Dockerfile

- Compose up, and visit `http://localhost:3000`.
- When updating frontend code, stop the service and then delete the sveltekit container and the sveltekit image and regenerate it with compose up.

#### Uploads mock

Uploads go to a local S3 mock ([S3Mock](https://github.com/adobe/S3Mock)) instead of Cloudflare R2. Start it with `podman compose up -d s3mock` (or `docker compose`). The `CLOUDFLARE_R2_*`, `VITE_STATIC_DOMAIN` and `VITE_CLOUDFLARE_IMAGES` values in `.env.development` point to it. **Note:** s3mock images are served at their original size.
