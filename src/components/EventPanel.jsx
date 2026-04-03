import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLANET_DATA, GLOBAL_EVENTS } from '../data/planetData';

export default function EventPanel({ 
  selectedPlanet, 
  onClose, 
  onEventTrigger,
  activeEvents 
}) {
  const [localActiveEvents, setLocalActiveEvents] = React.useState(new Set(activeEvents));
  
  useEffect(() => {
    setLocalActiveEvents(new Set(activeEvents));
  }, [activeEvents]);
  
  const data = selectedPlanet ? PLANET_DATA[selectedPlanet] : null;
  
  const handleEventClick = (event) => {
    const newEvents = new Set(localActiveEvents);
    
    if (event.type === 'reset') {
      newEvents.clear();
    } else if (newEvents.has(event.id)) {
      newEvents.delete(event.id);
    } else {
      newEvents.add(event.id);
    }
    
    setLocalActiveEvents(newEvents);
    onEventTrigger(event.id);
  };
  
  const isEventActive = (eventId) => localActiveEvents.has(eventId);
  
  return (
    <AnimatePresence>
      {selectedPlanet && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 h-full w-96 glassmorphism p-6 z-50 overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-neon-blue transition-colors text-2xl"
          >
            ✕
          </button>
          
          {/* Header */}
          <div className="mt-8 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              {data?.name}
            </h2>
            <p className="text-gray-400 text-sm">
              Select an event to trigger
            </p>
          </div>
          
          {/* Planet Events */}
          {data?.events && (
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-neon-blue mb-3">
                Planet Events
              </h3>
              {data.events.map((event) => (
                <motion.button
                  key={event.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEventClick(event)}
                  className={`w-full p-4 rounded-lg transition-all duration-300 ${
                    isEventActive(event.id)
                      ? 'bg-neon-blue/30 neon-glow border border-neon-blue/50'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-white text-lg mb-1">
                      {event.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {event.description}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
          
          {/* Global Events */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neon-purple mb-3">
              Global Events
            </h3>
            {GLOBAL_EVENTS.map((event) => (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEventClick(event)}
                className={`w-full p-4 rounded-lg transition-all duration-300 ${
                  isEventActive(event.id)
                    ? 'bg-neon-purple/30 neon-glow-purple border border-neon-purple/50'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-white text-lg mb-1">
                    {event.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {event.description}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Active Events Summary */}
          {localActiveEvents.size > 0 && (
            <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                Active Events ({localActiveEvents.size})
              </h3>
              <div className="space-y-2">
                {Array.from(localActiveEvents).map(eventId => (
                  <div key={eventId} className="text-sm text-gray-300">
                    • {eventId}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
