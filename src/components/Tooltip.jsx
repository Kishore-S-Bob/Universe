import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ planet, position }) {
  if (!planet) return null;
  
  return (
    <AnimatePresence>
      {planet && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed pointer-events-none z-40"
          style={{
            left: position.x + 20,
            top: position.y - 20,
          }}
        >
          <div className="glassmorphism px-4 py-2 rounded-lg">
            <span className="text-white font-semibold text-lg">
              {planet}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
