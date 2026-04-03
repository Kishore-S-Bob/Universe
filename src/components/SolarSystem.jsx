import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Sun from './Sun';
import Planet from './Planet';
import { PLANET_DATA } from '../data/planetData';

function BlackHole({ active, planets }) {
  const blackHoleRef = useRef();
  
  useFrame(() => {
    if (!blackHoleRef.current || !active) return;
    
    const time = Date.now() * 0.001;
    blackHoleRef.current.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
  });
  
  if (!active) return null;
  
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={blackHoleRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color={0x000000} />
      </mesh>
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial 
          color={0x4a00e0} 
          transparent 
          opacity={0.5}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color={0x4a00e0} intensity={3} distance={30} />
    </group>
  );
}

function CameraShake({ active, intensity = 0.1 }) {
  const cameraRef = useRef();
  const originalPosition = useRef(new THREE.Vector3(0, 30, 60));
  
  useFrame((state) => {
    if (!cameraRef.current) return;
    
    if (active) {
      const time = state.clock.getElapsedTime();
      cameraRef.current.position.x = originalPosition.current.x + Math.sin(time * 50) * intensity;
      cameraRef.current.position.y = originalPosition.current.y + Math.cos(time * 50) * intensity;
    } else {
      cameraRef.current.position.copy(originalPosition.current);
    }
  });
  
  return <perspectiveCamera ref={cameraRef} fov={45} position={[0, 30, 60]} />;
}

export default function SolarSystem({ 
  onPlanetClick, 
  hoveredPlanet, 
  onHoverPlanet,
  activeEvents 
}) {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 30, 60]} fov={45} />
        
        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={20}
          maxDistance={150}
          autoRotate={false}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.1} />
        
        {/* Background */}
        <Stars 
          radius={300} 
          depth={60} 
          count={20000} 
          factor={4} 
          saturation={0} 
          fade={true}
        />
        
        {/* Black Hole (global event) */}
        <BlackHole active={activeEvents.has('black-hole')} />
        
        {/* Sun */}
        <Sun 
          onEventTriggered={() => {}} 
          activeEvents={activeEvents}
        />
        
        {/* Planets */}
        {Object.keys(PLANET_DATA)
          .filter(key => key !== 'sun')
          .map(planetKey => (
            <Planet
              key={planetKey}
              planetKey={planetKey}
              onClick={onPlanetClick}
              onHover={onHoverPlanet}
              hovered={hoveredPlanet}
              activeEvents={activeEvents}
              orbitPaused={activeEvents.size > 0}
            />
          ))}
      </Canvas>
    </div>
  );
}
