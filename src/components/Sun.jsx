import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLANET_DATA } from '../data/planetData';

export default function Sun({ onEventTriggered, activeEvents }) {
  const sunRef = useRef();
  const glowRef = useRef();
  
  const originalRadius = PLANET_DATA.sun.radius;
  
  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += PLANET_DATA.sun.rotationSpeed;
    }
    
    // Handle solar flare event
    if (activeEvents.has('solar-flare') && glowRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 10) * 0.3;
      glowRef.current.scale.set(scale, scale, scale);
    } else if (glowRef.current) {
      glowRef.current.scale.set(1, 1, 1);
    }
    
    // Handle brightness boost
    if (activeEvents.has('brightness-boost') && sunRef.current) {
      const time = state.clock.getElapsedTime();
      const intensity = 1 + Math.sin(time * 5) * 0.5;
      sunRef.current.material.emissiveIntensity = 2 * intensity;
    } else if (sunRef.current) {
      sunRef.current.material.emissiveIntensity = 1;
    }
    
    // Handle mini supernova
    if (activeEvents.has('mini-supernova') && sunRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 15) * 0.5;
      sunRef.current.scale.set(scale, scale, scale);
      sunRef.current.material.emissiveIntensity = 3 + Math.sin(time * 10) * 2;
    } else if (sunRef.current) {
      sunRef.current.scale.set(1, 1, 1);
    }
  });
  
  const sunMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: PLANET_DATA.sun.color,
    emissive: PLANET_DATA.sun.emissive,
    emissiveIntensity: 1,
    roughness: 0.4,
    metalness: 0.1,
  }), []);
  
  return (
    <group>
      {/* Sun glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[originalRadius * 1.2, 32, 32]} />
        <meshBasicMaterial
          color={0xffaa00}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Main sun */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[originalRadius, 32, 32]} />
        <primitive object={sunMaterial} attach="material" />
      </mesh>
      
      {/* Point light */}
      <pointLight
        color={0xffdd00}
        intensity={2}
        distance={100}
        decay={1}
      />
    </group>
  );
}
