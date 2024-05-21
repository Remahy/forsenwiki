# forsenwiki

## Developing

- Install dependencies with `npm install`.
- Copy `.env.example` to a new file named `.env` and change the content accordingly.
- Run migrations & init seed `npm run prisma:migrate-dev && npm run prisma:seed`
- Start a dev server:

  ```bash
  npm run dev
  
  # or start the server and open the app in a new browser tab
  npm run dev -- --open
  ```
