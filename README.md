# forsenwiki

## Developing

- Install dependencies with `npm install`.
- Add some environment variables to a `.env` file, use `.env.example` for available environment variables.
- Run migrations & init seed `npm run prisma:migrate-dev && npm run prisma:seed`
- Start a dev server:

  ```bash
  npm run dev
  
  # or start the server and open the app in a new browser tab
  npm run dev -- --open
  ```
