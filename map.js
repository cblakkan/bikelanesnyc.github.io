let DEFAULT_CENTER = [-73.97, 40.68];
let MAX_BOUNDS = [
  [-74.1, 40.53],
  [-73.6, 40.95],
];
// Zoom-dependent line width: 3px at z11 → 6px at z14 → 10px at z17
let LINE_WIDTH = ["interpolate", ["linear"], ["zoom"], 11, 3, 14, 6, 17, 10];
let LINK_WIDTH = ["interpolate", ["linear"], ["zoom"], 11, 4.5, 14, 9, 17, 15];
let SIGNED_ROUTE_WIDTH = [
  "interpolate",
  ["linear"],
  ["zoom"],
  11,
  1.5,
  14,
  3,
  17,
  5,
];
let OPACITY = 1.0;

// Palette definitions
const PALETTES = {
  MTA: {
    protected: "#00933C",
    sidewalk: "#6CBE45",
    standard: "#0039A6",
    sharrows: "#FCCC0A",
    link: "orange",
    signed: "red",
  },
  "Cool & Muted": {
    protected: "#059669",
    sidewalk: "#6EE7B7",
    standard: "#7C3AED",
    sharrows: "#D97706",
    link: "#E11D48",
    signed: "#64748B",
  },
  "High Contrast": {
    protected: "#16A34A",
    sidewalk: "#84CC16",
    standard: "#4F46E5",
    sharrows: "#EC4899",
    link: "#EA580C",
    signed: "#DC2626",
  },
  "Warm Earthy": {
    protected: "#15803D",
    sidewalk: "#86EFAC",
    standard: "#0D9488",
    sharrows: "#C2410C",
    link: "#A21CAF",
    signed: "#92400E",
  },
};

let currentPaletteName =
  localStorage.getItem("bikemap-palette") || "High Contrast";
let currentPalette = PALETTES[currentPaletteName] || PALETTES["High Contrast"];

let PROTECTED_BIKELANE = currentPalette.protected;
let SIDEWALK_BIKELANE = currentPalette.sidewalk;
let STANDARD_BIKELANE = currentPalette.standard;
let SHARED_BIKELANE = currentPalette.sharrows;
let LINK_BIKELANE = currentPalette.link;
let SIGNED_ROUTE = currentPalette.signed;

// Layer ID → color lookup (used for popup accent bars)
let LAYER_COLORS = {
  protected: PROTECTED_BIKELANE,
  sidewalk: SIDEWALK_BIKELANE,
  standards: STANDARD_BIKELANE,
  sharrows: SHARED_BIKELANE,
  link: LINK_BIKELANE,
  "signed-route": SIGNED_ROUTE,
};

// Generate a chevron arrow image on a canvas
function createArrowImage(direction) {
  const size = 72;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const cx = size / 2;
  const cy = size / 2;
  const arrowW = size * 0.45;
  const arrowH = size * 0.55;

  ctx.beginPath();
  if (direction === "right") {
    ctx.moveTo(cx - arrowW / 2, cy - arrowH / 2);
    ctx.lineTo(cx + arrowW / 2, cy);
    ctx.lineTo(cx - arrowW / 2, cy + arrowH / 2);
  } else {
    ctx.moveTo(cx + arrowW / 2, cy - arrowH / 2);
    ctx.lineTo(cx - arrowW / 2, cy);
    ctx.lineTo(cx + arrowW / 2, cy + arrowH / 2);
  }
  ctx.closePath();

  // Filled white with dark outline
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

var map = new maplibregl.Map({
  container: "map",
  style:
    "https://api.maptiler.com/maps/b2512def-9887-424c-8274-dcae4a27558c/style.json?key=PhiQIVhvnvbs5yAOcy6M",
  center: DEFAULT_CENTER,
  maxBounds: MAX_BOUNDS,
  zoom: 13,
  minZoom: 11,
  maxZoom: 17,
  attributionControl: false,
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
});

map.on("load", async () => {
  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    }),
  );

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

  map.addSource("bikejson", {
    type: "geojson",
    data: BIKEJSON,
  });

  map.addLayer({
    id: "protected",
    type: "line",
    source: "bikejson",
    paint: {
      "line-color": PROTECTED_BIKELANE,
      "line-width": LINE_WIDTH,
      "line-opacity": OPACITY,
    },
    filter: [
      "any",
      ["==", ["get", "ft_facilit"], "Protected"],
      ["==", ["get", "tf_facilit"], "Protected"],
      ["==", ["get", "grnwy"], "Greenway"],
    ],
  });

  // Generate arrow images from canvas
  map.addImage("arrow-left", createArrowImage("left"), { pixelRatio: 2 });
  map.addImage("arrow-right", createArrowImage("right"), { pixelRatio: 2 });

  map.addLayer({
    id: "sidewalk",
    type: "line",
    source: "bikejson",
    paint: {
      "line-color": SIDEWALK_BIKELANE,
      "line-width": LINE_WIDTH,
      "line-opacity": OPACITY,
    },
    filter: [
      "any",
      ["==", ["get", "ft_facilit"], "Sidewalk"],
      ["==", ["get", "tf_facilit"], "Sidewalk"],
      ["==", ["get", "ft_facilit"], "Boardwalk"],
      ["==", ["get", "tf_facilit"], "Boardwalk"],
    ],
  });

  map.addLayer({
    id: "standards",
    type: "line",
    source: "bikejson",
    paint: {
      "line-color": STANDARD_BIKELANE,
      "line-width": LINE_WIDTH,
      "line-opacity": OPACITY,
    },
    filter: [
      "any",
      ["==", ["get", "ft_facilit"], "Conventional"],
      ["==", ["get", "tf_facilit"], "Conventional"],
      ["==", ["get", "ft_facilit"], "Conventional Buffered"],
      ["==", ["get", "tf_facilit"], "Conventional Buffered"],
      ["==", ["get", "ft_facilit"], "Curbside"],
      ["==", ["get", "tf_facilit"], "Curbside"],
      ["==", ["get", "ft_facilit"], "Curbside Buffered"],
      ["==", ["get", "tf_facilit"], "Curbside Buffered"],
    ],
  });

  map.addLayer({
    id: "sharrows",
    type: "line",
    source: "bikejson",
    paint: {
      "line-color": SHARED_BIKELANE,
      "line-width": LINE_WIDTH,
      "line-opacity": OPACITY,
    },
    filter: [
      "any",
      ["==", ["get", "ft_facilit"], "Shared"],
      ["==", ["get", "tf_facilit"], "Shared"],
    ],
  });

  map.addLayer({
    id: "link",
    type: "line",
    source: "bikejson",
    paint: {
      "line-color": LINK_BIKELANE,
      "line-width": LINK_WIDTH,
      "line-opacity": OPACITY,
    },
    filter: [
      "any",
      ["==", ["get", "ft_facilit"], "Link"],
      ["==", ["get", "tf_facilit"], "Link"],
    ],
  });

  map.addLayer({
    id: "signed-route",
    type: "line",
    source: "bikejson",
    paint: {
      "line-color": SIGNED_ROUTE,
      "line-width": SIGNED_ROUTE_WIDTH,
      "line-opacity": OPACITY,
      "line-dasharray": [2, 2],
    },
    filter: [
      "any",
      ["==", ["get", "ft_facilit"], "Signed Route"],
      ["==", ["get", "tf_facilit"], "Signed Route"],
      ["==", ["get", "ft_facilit"], "Wide Parking Lane"],
      ["==", ["get", "tf_facilit"], "Wide Parking Lane"],
    ],
  });

  map.addLayer({
    id: "l-labels",
    type: "symbol",
    source: "bikejson",
    layout: {
      "icon-image": "arrow-left",
      "icon-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11,
        0.3,
        14,
        0.45,
        17,
        0.6,
      ],
      "icon-rotation-alignment": "map",
      "symbol-placement": "line",
      "symbol-spacing": 150,
      "icon-allow-overlap": false,
      "icon-padding": 2,
    },
    paint: {
      "icon-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11,
        1,
        14,
        1,
        17,
        1,
      ],
    },
    filter: ["any", ["==", ["get", "bikedir"], "L"]],
  });

  map.addLayer({
    id: "r-labels",
    type: "symbol",
    source: "bikejson",
    layout: {
      "icon-image": "arrow-right",
      "icon-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11,
        0.3,
        14,
        0.45,
        17,
        0.6,
      ],
      "icon-rotation-alignment": "map",
      "symbol-placement": "line",
      "symbol-spacing": 150,
      "icon-allow-overlap": false,
      "icon-padding": 2,
    },
    paint: {
      "icon-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11,
        1,
        14,
        1,
        17,
        1,
      ],
    },
    filter: ["any", ["==", ["get", "bikedir"], "R"]],
  });

  const routeLayers = [
    "protected",
    "sidewalk",
    "standards",
    "sharrows",
    "link",
    "signed-route",
  ];

  routeLayers.forEach((layer) => {
    map.on("click", layer, (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties;
      const streetName = props.street || props.name || "Unknown Street";
      const facilityType = props.ft_facilit || props.tf_facilit || "Bike Route";
      const accentColor = LAYER_COLORS[layer] || "#999";

      new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(
          `
                    <div class="popup-inner">
                        <div class="popup-accent" style="background-color: ${accentColor}"></div>
                        <div class="popup-body">
                            <div class="popup-title">${streetName}</div>
                            <div class="popup-type">${facilityType}</div>
                        </div>
                    </div>
                `,
        )
        .addTo(map);
    });

    map.on("mouseenter", layer, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layer, () => {
      map.getCanvas().style.cursor = "";
    });
  });
});

const legendContent = document.getElementById("legend-content");
const legendOverlay = document.getElementById("legend-overlay");
const legendToggle = document.getElementById("legend-toggle");
const legendClose = document.getElementById("legend-close");

function showLegend() {
  hidePalette();
  legendContent.classList.add("visible");
  legendOverlay.classList.add("visible");
}

function hideLegend() {
  legendContent.classList.remove("visible");
  legendOverlay.classList.remove("visible");
}

legendToggle.addEventListener("click", function () {
  if (legendContent.classList.contains("visible")) {
    hideLegend();
  } else {
    showLegend();
  }
});

legendClose.addEventListener("click", hideLegend);
legendOverlay.addEventListener("click", function () {
  hideLegend();
  hidePalette();
});

// Palette switching
function applyPalette(name) {
  const p = PALETTES[name];
  if (!p) return;
  currentPaletteName = name;
  currentPalette = p;

  PROTECTED_BIKELANE = p.protected;
  SIDEWALK_BIKELANE = p.sidewalk;
  STANDARD_BIKELANE = p.standard;
  SHARED_BIKELANE = p.sharrows;
  LINK_BIKELANE = p.link;
  SIGNED_ROUTE = p.signed;

  LAYER_COLORS = {
    protected: p.protected,
    sidewalk: p.sidewalk,
    standards: p.standard,
    sharrows: p.sharrows,
    link: p.link,
    "signed-route": p.signed,
  };

  if (map.getLayer("protected")) {
    map.setPaintProperty("protected", "line-color", p.protected);
    map.setPaintProperty("sidewalk", "line-color", p.sidewalk);
    map.setPaintProperty("standards", "line-color", p.standard);
    map.setPaintProperty("sharrows", "line-color", p.sharrows);
    map.setPaintProperty("link", "line-color", p.link);
    map.setPaintProperty("signed-route", "line-color", p.signed);
  }

  // Update legend swatches
  document.querySelectorAll(".legend-line[data-layer]").forEach((el) => {
    const layer = el.dataset.layer;
    if (layer === "signed-route") {
      el.style.background =
        "repeating-linear-gradient(90deg, " +
        p.signed +
        " 0px, " +
        p.signed +
        " 4px, transparent 4px, transparent 8px)";
    } else {
      el.style.backgroundColor = LAYER_COLORS[layer];
    }
  });

  // Update palette picker active state
  document.querySelectorAll(".palette-option").forEach((el) => {
    el.classList.toggle("active", el.dataset.palette === name);
  });

  // Update palette toggle icon
  document.getElementById("pdot-0").setAttribute("fill", p.protected);
  document.getElementById("pdot-1").setAttribute("fill", p.standard);
  document.getElementById("pdot-2").setAttribute("fill", p.sharrows);
  document.getElementById("pdot-3").setAttribute("fill", p.link);

  localStorage.setItem("bikemap-palette", name);
}

// Populate palette picker and apply saved palette
function initPalettePicker() {
  const container = document.getElementById("palette-options");
  for (const [name, colors] of Object.entries(PALETTES)) {
    const opt = document.createElement("div");
    opt.className = "palette-option";
    opt.dataset.palette = name;

    const dots = document.createElement("div");
    dots.className = "palette-dots";
    for (const color of Object.values(colors)) {
      const dot = document.createElement("span");
      dot.style.background = color;
      dots.appendChild(dot);
    }

    const label = document.createElement("span");
    label.className = "palette-name";
    label.textContent = name;

    opt.appendChild(dots);
    opt.appendChild(label);
    opt.addEventListener("click", () => {
      applyPalette(name);
      hidePalette();
    });
    container.appendChild(opt);
  }
  applyPalette(currentPaletteName);
}

// Palette panel show/hide
const paletteContent = document.getElementById("palette-content");
const paletteToggle = document.getElementById("palette-toggle");
const paletteClose = document.getElementById("palette-close");

function showPalette() {
  hideLegend();
  paletteContent.classList.add("visible");
  legendOverlay.classList.add("visible");
}

function hidePalette() {
  paletteContent.classList.remove("visible");
  legendOverlay.classList.remove("visible");
}

paletteToggle.addEventListener("click", function () {
  if (paletteContent.classList.contains("visible")) {
    hidePalette();
  } else {
    showPalette();
  }
});

paletteClose.addEventListener("click", hidePalette);

initPalettePicker();
