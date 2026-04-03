import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import SolarSystem from './components/SolarSystem';
import EventPanel from './components/EventPanel';
import Tooltip from './components/Tooltip';

function App() {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [activeEvents, setActiveEvents] = useState(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handlePlanetClick = useCallback((planetKey) => {
    setSelectedPlanet(planetKey);
  }, []);
  
  const handleHoverPlanet = useCallback((planetKey) => {
    setHoveredPlanet(planetKey);
  }, []);
  
  const handleEventTrigger = useCallback((eventId) => {
    setActiveEvents(prev => {
      const newEvents = new Set(prev);
      
      if (eventId === 'reset') {
        newEvents.clear();
      } else if (newEvents.has(eventId)) {
        newEvents.delete(eventId);
      } else {
        newEvents.add(eventId);
      }
      
      return newEvents;
    });
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);
  
  const handleClosePanel = useCallback(() => {
    setSelectedPlanet(null);
  }, []);
  
  return (
    <div 
      className="w-full h-screen bg-cosmic-blue relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-white text-center mb-2"
        >
          Interactive Solar System
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-400 text-center text-sm md:text-base"
        >
          Click on a planet to trigger cosmic events • Drag to rotate • Scroll to zoom
        </motion.p>
      </div>
      
      {/* 3D Scene */}
      <SolarSystem
        onPlanetClick={handlePlanetClick}
        hoveredPlanet={hoveredPlanet}
        onHoverPlanet={handleHoverPlanet}
        activeEvents={activeEvents}
      />
      
      {/* Event Panel */}
      <EventPanel
        selectedPlanet={selectedPlanet}
        onClose={handleClosePanel}
        onEventTrigger={handleEventTrigger}
        activeEvents={activeEvents}
      />
      
      {/* Tooltip */}
      <Tooltip
        planet={hoveredPlanet}
        position={mousePosition}
      />
      
      {/* Active Events Indicator */}
      {activeEvents.size > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-6 left-6 z-10 glassmorphism px-4 py-2 rounded-lg neon-glow-purple"
        >
          <span className="text-white text-sm">
            {activeEvents.size} active event{activeEvents.size !== 1 ? 's' : ''}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default App;
