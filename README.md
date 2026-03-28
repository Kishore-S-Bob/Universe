# 🌌 Universe Builder

A fully interactive 3D universe creation sandbox built with Three.js where you can create, modify, and explore your own cosmic systems in real-time.

## ✨ Features

### 🌟 Star System Creation
- **Create Stars**: Add multiple stars with customizable size, color, and glow intensity
- **Dynamic Lighting**: Each star emits realistic point light that illuminates orbiting planets
- **Glow Effects**: Beautiful corona and glow effects around each star

### 🪐 Planet System
- **Add Planets**: Create planets orbiting any star with custom properties:
  - Size and color
  - Distance from parent star
  - Orbit speed
  - Rotation speed
- **Orbit Lines**: Toggle visual orbit paths for better visualization

### 🌙 Moon System
- **Add Moons**: Attach moons to any planet
- **Orbit Mechanics**: Moons orbit their parent planets realistically

### 🎮 Interactivity
- **Click to Select**: Click any star, planet, or moon to select and view its properties
- **Inspector Panel**: Edit all object properties in real-time:
  - Size
  - Speed (orbit and rotation)
  - Color
  - Distance
  - Glow intensity (for stars)
- **Context Menu**: Right-click any object for quick actions (Focus, Edit, Delete)
- **Hover Effects**: Objects highlight when hovered

### 🎥 Camera System
- **Orbit Controls**: Zoom, pan, and rotate around your universe
- **Focus Mode**: Click the Focus button to smoothly zoom to any selected object
- **Back to Universe**: Return to the full universe view with one click
- **Auto-Rotate**: Optional automatic camera rotation

### ⏱️ Time Control
- **Play/Pause**: Stop or resume the simulation
- **Reverse Time**: Watch your universe run backwards
- **Speed Control**: Adjust time from 0x to 4x speed
- **Real-time Updates**: All changes apply instantly

### 🎨 Visual Features
- **Dynamic Starfield**: 15,000 procedurally generated background stars
- **Subtle Parallax**: Background stars slowly rotate for depth effect
- **Glow Effects**: Stars have multi-layered glow with animated corona
- **Smooth Animations**: Fluid object movements and camera transitions

### 📁 Save & Load
- **Save Universe**: Export your creation as a JSON file
- **Load Universe**: Import previously saved universes
- **Random Generator**: Generate a random universe with one click

### 🎯 Universe Management
- **Clear All**: Delete all objects and start fresh
- **Reset View**: Return camera to default position
- **Toggle Orbits**: Show/hide orbit path lines

## 🚀 Getting Started

### Installation
Simply open `index.html` in a web browser. No build process required!

### Basic Usage

1. **Create a Star**: Click "Add Star" button to create your first star
2. **Add Planets**: Once you have a star, the "Add Planet" button becomes enabled
3. **Customize**: Click any object to open the Inspector Panel and modify properties
4. **Explore**: Use mouse to rotate, scroll to zoom, and right-click to pan
5. **Generate Random**: Click "Generate Random" to instantly create a random universe

### Controls

| Action | Control |
|---------|----------|
| Rotate Camera | Left-click + drag |
| Zoom | Scroll wheel |
| Pan | Right-click + drag |
| Select Object | Left-click on object |
| Focus on Object | Click Focus button in Inspector |
| Edit Object | Click on object to open Inspector |
| Delete Object | Click Delete in Inspector or use context menu |
| Context Menu | Right-click on object |

## 🎨 UI Design

The interface features a modern glassmorphism design with:
- Translucent panels with blur effects
- Gradient buttons with glow effects
- Smooth animations and transitions
- Responsive layout for desktop and mobile

## 📱 Responsive Design

The application works seamlessly on:
- **Desktop**: Full keyboard and mouse controls
- **Tablet**: Touch-optimized controls
- **Mobile**: Simplified UI for smaller screens

## 🔧 Technical Details

### Technology Stack
- **Three.js r128**: 3D rendering engine
- **HTML5/CSS3**: Modern UI with glassmorphism effects
- **Vanilla JavaScript**: No build tools or frameworks required

### Performance Optimizations
- Efficient geometry reuse
- Optimized rendering for multiple objects
- Smooth 60fps animations
- Minimal memory footprint

### Features Implemented
- ✅ Star creation with customizable properties
- ✅ Planet creation with orbital mechanics
- ✅ Moon system for planets
- ✅ Object selection and editing
- ✅ Real-time property updates
- ✅ Focus mode with smooth camera transitions
- ✅ Time controls (play, pause, reverse, speed)
- ✅ Dynamic starfield background
- ✅ Orbit line visualization
- ✅ Save/Load universe (JSON)
- ✅ Random universe generator
- ✅ Context menu for quick actions
- ✅ Hover effects and tooltips
- ✅ Responsive design
- ✅ Glassmorphism UI

## 🎮 Browser Compatibility

Works on all modern browsers that support WebGL:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 📝 Future Enhancements (Optional)

Potential features for future development:
- [ ] Planet texture support
- [ ] Ring systems (like Saturn)
- [ ] Collision detection
- [ ] Asteroid fields
- [ ] Comets with elliptical orbits
- [ ] Binary star systems
- [ ] Nebula effects
- [ ] Gravity simulation
- [ ] Export universe as video
- [ ] Multi-user collaboration

## 📄 License

This project is open source and available for educational and personal use.

## 🙏 Acknowledgments

Built with:
- [Three.js](https://threejs.org/) - 3D graphics library
- [OrbitControls](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/controls/OrbitControls.js) - Camera controls
- Google Fonts - Orbitron & Rajdhani fonts
