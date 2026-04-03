export const PLANET_DATA = {
  sun: {
    name: "Sun",
    radius: 3,
    color: 0xffdd00,
    emissive: 0xffaa00,
    distance: 0,
    orbitSpeed: 0,
    rotationSpeed: 0.001,
    events: [
      {
        id: "solar-flare",
        name: "☀️ Solar Flare",
        description: "Trigger a massive solar flare burst",
        type: "flare"
      },
      {
        id: "brightness-boost",
        name: "💡 Super Brightness",
        description: "Increase sun intensity dramatically",
        type: "brightness"
      },
      {
        id: "mini-supernova",
        name: "💥 Mini Supernova",
        description: "Simulate a mini supernova explosion",
        type: "supernova"
      }
    ]
  },
  mercury: {
    name: "Mercury",
    radius: 0.3,
    color: 0x8c7853,
    distance: 8,
    orbitSpeed: 0.02,
    rotationSpeed: 0.005,
    events: [
      {
        id: "speed-up",
        name: "🚀 Speed Boost",
        description: "Increase Mercury's orbit speed",
        type: "speed"
      },
      {
        id: "size-up",
        name: "📈 Size Up",
        description: "Make Mercury twice as big",
        type: "size"
      }
    ]
  },
  venus: {
    name: "Venus",
    radius: 0.5,
    color: 0xffc649,
    distance: 12,
    orbitSpeed: 0.015,
    rotationSpeed: 0.003,
    events: [
      {
        id: "atmosphere",
        name: "🌫️ Thick Atmosphere",
        description: "Add visible atmospheric glow",
        type: "atmosphere"
      },
      {
        id: "reverse-orbit",
        name: "↩️ Reverse Orbit",
        description: "Make Venus orbit backwards",
        type: "reverse"
      }
    ]
  },
  earth: {
    name: "Earth",
    radius: 0.6,
    color: 0x6b93d6,
    distance: 16,
    orbitSpeed: 0.01,
    rotationSpeed: 0.02,
    hasMoon: true,
    events: [
      {
        id: "second-moon",
        name: "🌙 Second Moon",
        description: "Add a second moon orbiting Earth",
        type: "add-moon"
      },
      {
        id: "moon-closer",
        name: "🔭 Bigger Moon",
        description: "Bring the moon closer and make it larger",
        type: "moon-size"
      },
      {
        id: "saturn-rings",
        name: "💍 Saturn Rings",
        description: "Add Saturn-like rings to Earth",
        type: "rings"
      }
    ]
  },
  mars: {
    name: "Mars",
    radius: 0.4,
    color: 0xc1440e,
    distance: 20,
    orbitSpeed: 0.008,
    rotationSpeed: 0.018,
    events: [
      {
        id: "terraform",
        name: "🌱 Terraform",
        description: "Turn Mars green and blue",
        type: "terraform"
      },
      {
        id: "moons",
        name: "🌑 Add Moons",
        description: "Add Phobos and Deimos",
        type: "add-moons"
      }
    ]
  },
  jupiter: {
    name: "Jupiter",
    radius: 1.5,
    color: 0xd8ca9d,
    distance: 28,
    orbitSpeed: 0.005,
    rotationSpeed: 0.04,
    events: [
      {
        id: "great-red-spot",
        name: "🔴 Red Spot Glow",
        description: "Make the Great Red Spot glow",
        type: "glow"
      },
      {
        id: "shrink",
        name: "📉 Shrink",
        description: "Reduce Jupiter's size by half",
        type: "size-down"
      }
    ]
  },
  saturn: {
    name: "Saturn",
    radius: 1.2,
    color: 0xead6b8,
    distance: 36,
    orbitSpeed: 0.004,
    rotationSpeed: 0.038,
    hasRings: true,
    events: [
      {
        id: "drop-water",
        name: "💧 Drop in Water",
        description: "Show ripple simulation effect",
        type: "water"
      },
      {
        id: "remove-rings",
        name: "🚫 Remove Rings",
        description: "Strip Saturn of its beautiful rings",
        type: "remove-rings"
      },
      {
        id: "double-rings",
        name: "💍 Double Rings",
        description: "Make the rings twice as large",
        type: "double-rings"
      }
    ]
  },
  uranus: {
    name: "Uranus",
    radius: 0.8,
    color: 0xd1e7e7,
    distance: 44,
    orbitSpeed: 0.003,
    rotationSpeed: 0.03,
    events: [
      {
        id: "tilt",
        name: "🔄 Extreme Tilt",
        description: "Increase Uranus's axial tilt",
        type: "tilt"
      },
      {
        id: "color-shift",
        name: "🎨 Color Shift",
        description: "Change Uranus to a different color",
        type: "color"
      }
    ]
  },
  neptune: {
    name: "Neptune",
    radius: 0.8,
    color: 0x5b5ddf,
    distance: 52,
    orbitSpeed: 0.002,
    rotationSpeed: 0.032,
    events: [
      {
        id: "storm",
        name: "🌀 Dark Storm",
        description: "Create a visible dark storm",
        type: "storm"
      },
      {
        id: "speed-up",
        name: "💨 Wind Speed",
        description: "Increase wind speed (rotation)",
        type: "speed"
      }
    ]
  }
};

export const GLOBAL_EVENTS = [
  {
    id: "black-hole",
    name: "🕳️ Spawn Black Hole",
    description: "Create a black hole that pulls nearby planets",
    type: "black-hole"
  },
  {
    id: "reset",
    name: "🔄 Reset System",
    description: "Restore the solar system to its original state",
    type: "reset"
  }
];
