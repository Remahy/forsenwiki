# postgres migration

0. Downgrade `docker-compose.yml` postgres to the last working version.
1. docker exec -it [postgres-container-id] pg_dumpall -U postgres > db_backup.sql
2. docker stop [postgres-container-id]
3. Update `docker-compose.yml`:
```yaml
  postgres:
    image: postgres:[18]-alpine3.22 # Change [this].
    restart: always
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata-[18]:/var/lib/postgresql/[18]/docker # Change [these].
```
4. cat db_backup.sql | podman exec -i [postgres-container-id] psql -U postgres
