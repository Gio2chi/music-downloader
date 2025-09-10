#!/bin/sh
# Initialize DB
sqlite3 ./sqlite.db < ./schema.sql

exec "$@"