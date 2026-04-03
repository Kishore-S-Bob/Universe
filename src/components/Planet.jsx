import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLANET_DATA } from '../data/planetData';

export default function Planet({ 
  planetKey, 
  onClick, 
  onHover, 
  hovered, 
  activeEvents,
  orbitPaused 
}) {
  const planetRef = useRef();
  const orbitRef = useRef();
  const moonRef = useRef();
  const extraMoonRef = useRef();
  const ringsRef = useRef();
  const groupRef = useRef();
  
  const data = PLANET_DATA[planetKey];
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Orbit around sun
    if (!orbitPaused) {
      const time = state.clock.getElapsedTime();
      const speed = activeEvents.has('reverse-orbit') ? -data.orbitSpeed : data.orbitSpeed;
      const finalSpeed = activeEvents.has('speed-up') && planetKey === 'mercury' 
        ? speed * 3 
        : speed;
      groupRef.current.rotation.y = time * finalSpeed;
    }
    
    // Self rotation
    if (planetRef.current) {
      const rotationSpeed = activeEvents.has('speed-up') && planetKey === 'neptune'
        ? data.rotationSpeed * 3
        : data.rotationSpeed;
      planetRef.current.rotation.y += rotationSpeed;
    }
    
    // Moon orbit (Earth)
    if (moonRef.current && data.hasMoon) {
      const time = state.clock.getElapsedTime();
      const moonDistance = activeEvents.has('moon-closer') ? 1.2 : 2;
      moonRef.current.position.x = Math.cos(time * 2) * moonDistance;
      moonRef.current.position.z = Math.sin(time * 2) * moonDistance;
    }
    
    // Extra moon (Earth)
    if (extraMoonRef.current && activeEvents.has('second-moon')) {
      const time = state.clock.getElapsedTime();
      extraMoonRef.current.position.x = Math.cos(time * 1.5 + Math.PI) * 2.5;
      extraMoonRef.current.position.z = Math.sin(time * 1.5 + Math.PI) * 2.5;
    }
    
    // Jupiter glow effect
    if (planetRef.current && activeEvents.has('glow') && planetKey === 'jupiter') {
      const time = state.clock.getElapsedTime();
      planetRef.current.material.emissiveIntensity = 0.5 + Math.sin(time * 5) * 0.3;
    }
    
    // Size changes
    if (planetRef.current) {
      const scale = activeEvents.has('size-up') && planetKey === 'mercury' 
        ? 2 
        : activeEvents.has('size-down') && planetKey === 'jupiter'
        ? 0.5
        : 1;
      planetRef.current.scale.set(scale, scale, scale);
    }
  });
  
  // Handle color changes for Mars terraforming
  useEffect(() => {
    if (planetRef.current && planetKey === 'mars') {
      if (activeEvents.has('terraform')) {
        planetRef.current.material.color.setHex(0x4a7c23);
      } else {
        planetRef.current.material.color.setHex(data.color);
      }
    }
  }, [activeEvents, planetKey, data.color]);
  
  // Handle color changes for Uranus
  useEffect(() => {
    if (planetRef.current && planetKey === 'uranus') {
      if (activeEvents.has('color-shift')) {
        planetRef.current.material.color.setHex(0xff6b9d);
      } else {
        planetRef.current.material.color.setHex(data.color);
      }
    }
  }, [activeEvents, planetKey, data.color]);
  
  // Handle tilt for Uranus
  useEffect(() => {
    if (planetRef.current && planetKey === 'uranus') {
      if (activeEvents.has('tilt')) {
        planetRef.current.rotation.z = Math.PI / 2 + 0.5;
      } else {
        planetRef.current.rotation.z = 0;
      }
    }
  }, [activeEvents, planetKey]);
  
  // Handle Saturn rings
  useEffect(() => {
    if (ringsRef.current && planetKey === 'saturn') {
      if (activeEvents.has('remove-rings')) {
        ringsRef.current.visible = false;
      } else if (activeEvents.has('double-rings')) {
        ringsRef.current.scale.set(2, 2, 2);
        ringsRef.current.visible = true;
      } else {
        ringsRef.current.scale.set(1, 1, 1);
        ringsRef.current.visible = true;
      }
    }
  }, [activeEvents, planetKey]);
  
  const handlePointerOver = (e) => {
    e.stopPropagation();
    onHover(planetKey);
  };
  
  const handlePointerOut = (e) => {
    e.stopPropagation();
    onHover(null);
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    onClick(planetKey);
  };
  
  return (
    <group ref={groupRef}>
      {/* Orbit path */}
      <mesh ref={orbitRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[data.distance - 0.05, data.distance + 0.05, 64]} />
        <meshBasicMaterial 
          color={0xffffff} 
          transparent 
          opacity={0.1} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Planet group */}
      <group position={[data.distance, 0, 0]}>
        {/* Saturn Rings */}
        {data.hasRings && (
          <mesh ref={ringsRef} rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[1.8, 2.5, 64]} />
            <meshStandardMaterial
              color={0xc9a86c}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Earth Rings (event) */}
        {planetKey === 'earth' && activeEvents.has('saturn-rings') && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[1.5, 2.2, 64]} />
            <meshStandardMaterial
              color={0x88ccff}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
        
        {/* Main Planet */}
        <mesh
          ref={planetRef}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshStandardMaterial
            color={data.color}
            roughness={0.8}
            metalness={0.1}
            emissive={hovered === planetKey ? data.color : 0x000000}
            emissiveIntensity={hovered === planetKey ? 0.3 : 0}
          />
        </mesh>
        
        {/* Earth's Moon */}
        {data.hasMoon && (
          <mesh ref={moonRef}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={0xcccccc} />
          </mesh>
        )}
        
        {/* Extra Moon (Earth event) */}
        {activeEvents.has('second-moon') && (
          <mesh ref={extraMoonRef}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={0xaaaaaa} />
          </mesh>
        )}
        
        {/* Mars Moons (event) */}
        {planetKey === 'mars' && activeEvents.has('moons') && (
          <>
            <mesh position={[1.2, 0, 0]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color={0x8b4513} />
            </mesh>
            <mesh position={[-1, 0, 0.5]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color={0xa0522d} />
            </mesh>
          </>
        )}
        
        {/* Venus Atmosphere (event) */}
        {planetKey === 'venus' && activeEvents.has('atmosphere') && (
          <mesh scale={[1.1, 1.1, 1.1]}>
            <sphereGeometry args={[data.radius, 32, 32]} />
            <meshStandardMaterial
              color={0xffcc99}
              transparent
              opacity={0.3}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
