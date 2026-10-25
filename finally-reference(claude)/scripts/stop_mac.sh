#!/usr/bin/env bash
# Stops and removes the container; the db/ folder (your data) is kept.
docker rm -f finally >/dev/null 2>&1 && echo "Stopped." || echo "Not running."
