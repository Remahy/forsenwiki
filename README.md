# forsenwiki

## Developing

Don't have Postgres installed locally? Skip this and use the dockerfile.

- Install dependencies with `npm install`.
- Copy `.env.example` to a new file named `.env` and change the content accordingly.
- Run migrations & init seed `npm run prisma:migrate-dev && npm run prisma:seed`
- Start a dev server:

  ```bash
  npm run dev
  
  # or start the server and open the app in a new browser tab
  npm run dev -- --open
  ```

### Twitch console

- Add `http://localhost:5080/auth/callback/twitch` to make "Login" work.

### Dockerfile

- Compose up, and visit `http://localhost:5080`.
- When updating frontend code, stop the service and then delete the sveltekit container and the sveltekit image and regenerate it with compose up.
