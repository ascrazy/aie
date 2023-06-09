install:
	docker compose run --rm app npm install

start:
	docker compose run --rm app npm start

ingest:
	docker compose run --rm app npm run ingest

sh:
	docker compose run --rm app /bin/sh

db-migrate:
	docker compose run --rm app npm run migrate up

db-reset:
	docker compose down
	docker compose rm
	docker volume rm aie_db-data

db-renew: db-reset db-migrate

db-add-migration:
	docker compose run --rm app npm run migrate create new_migration
	sudo chown -R ialex:ialex ./migrations

chown:
	sudo chown -R ialex:ialex .

psql:
	docker compose run -e PGPASSWORD=hello --rm db psql -h db -U postgres
