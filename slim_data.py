"""Slim the NYC DOT bike routes GeoJSON export down to what map.js uses.

Usage: python3 -I slim_data.py <raw.geojson> <out.json>

- Drops retired segments (status != "Current")
- Keeps only the properties map.js reads
- Rounds coordinates to 6 decimals (~10 cm)
- Writes compact JSON
"""

import json
import sys

KEEP = ("ft_facilit", "tf_facilit", "grnwy", "bikedir", "street")
PRECISION = 6


def round_coords(c):
    if c and isinstance(c[0], (int, float)):
        return [round(v, PRECISION) for v in c]
    return [round_coords(x) for x in c]


def main(src, dst):
    with open(src) as f:
        raw = json.load(f)

    features = []
    for feat in raw["features"]:
        props = feat.get("properties") or {}
        geom = feat.get("geometry")
        if props.get("status") != "Current" or not geom:
            continue
        features.append({
            "type": "Feature",
            "properties": {k: props[k] for k in KEEP if props.get(k) is not None},
            "geometry": {"type": geom["type"], "coordinates": round_coords(geom["coordinates"])},
        })

    if not features:
        sys.exit("No current features found; refusing to write empty dataset")

    with open(dst, "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f, separators=(",", ":"))
    print(f"Wrote {len(features)} of {len(raw['features'])} features to {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
