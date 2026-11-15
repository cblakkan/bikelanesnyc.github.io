#!/usr/bin/env bash
# Download the latest NYC bike routes, slim them, and point map.js at the
# new content-hashed URL so browsers can cache the data indefinitely.
set -euo pipefail
cd "$(dirname "$0")"

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

curl -sf 'https://data.cityofnewyork.us/api/geospatial/mzxg-pwib?method=export&format=GeoJSON' -o "$tmp"
python3 -I slim_data.py "$tmp" bikeroutes.min.json

hash=$(shasum -a 256 bikeroutes.min.json | cut -c1-12)
sed -i.bak -E "s|bikeroutes\.min\.json\?v=[0-9a-f]+|bikeroutes.min.json?v=${hash}|" map.js && rm map.js.bak
grep -q "bikeroutes.min.json?v=${hash}" map.js || { echo "Failed to update data version in map.js" >&2; exit 1; }
echo "Data version: ${hash}"
