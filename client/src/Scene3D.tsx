import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Individual floating shape component
function FloatingShape({ 
  position, 
  color, 
  geometry, 
  speed = 1, 
  rotationSpeed = 0.5,
  scale = 1 
}: {
  position: [number, number, number];
  color: string;
  geometry: 'box' | 'torus' | 'icosahedron' | 'octahedron' | 'torusKnot' | 'dodecahedron';
  speed?: number;
  rotationSpeed?: number;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003 * rotationSpeed;
      meshRef.current.rotation.y += 0.005 * rotationSpeed;
      meshRef.current.rotation.z += 0.002 * rotationSpeed;
      
      // Subtle floating motion
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
    }
  });

  const getGeometry = () => {
    switch (geometry) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'torus':
        return <torusGeometry args={[0.7, 0.3, 16, 32]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[0.8, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[0.8, 0]} />;
      case 'torusKnot':
        return <torusKnotGeometry args={[0.5, 0.2, 64, 16]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[0.7, 0]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <Float speed={speed * 2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {getGeometry()}
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
        {/* Wireframe overlay for brutalist aesthetic */}
        <mesh scale={1.01}>
          {getGeometry()}
          <meshBasicMaterial color="#1a1a2e" wireframe transparent opacity={0.3} />
        </mesh>
      </mesh>
    </Float>
  );
}

// Particle field component
function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null!);
  
  const particles = useMemo(() => {
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#FFD700" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Main Scene3D component
export default function Scene3D() {
  return (
    <div className="three-canvas-container">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#FFD700" />
        <directionalLight position={[-5, -3, 2]} intensity={0.5} color="#FF6B9D" />
        <pointLight position={[0, 3, 4]} intensity={0.8} color="#00D4FF" />

        {/* Floating geometric shapes with Neo-brutalism colors */}
        <FloatingShape position={[-4, 1.5, -2]} color="#FFD700" geometry="torus" speed={0.8} scale={0.9} />
        <FloatingShape position={[4.5, -0.5, -1]} color="#FF6B9D" geometry="icosahedron" speed={1.2} scale={0.7} />
        <FloatingShape position={[-2, -1.5, -3]} color="#00D4FF" geometry="octahedron" speed={0.6} scale={0.8} />
        <FloatingShape position={[2.5, 2, -2.5]} color="#7CFC00" geometry="box" speed={1} scale={0.65} rotationSpeed={0.7} />
        <FloatingShape position={[-3.5, -0.5, 0]} color="#B388FF" geometry="dodecahedron" speed={0.9} scale={0.55} />
        <FloatingShape position={[3.5, 1, 0.5]} color="#FF8C42" geometry="torusKnot" speed={0.7} scale={0.5} />

        <ParticleField />
      </Canvas>
    </div>
  );
}
