"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/** The hero's signature: a ligand molecule searching for, then locking onto,
 * a receptor pocket — a small, self-contained dramatization of what the
 * platform actually does (AI-guided binding prediction), distinct from the
 * ball-and-stick compound viewer used later in AIEngineSection. */

const RECEPTOR_NODES: [number, number, number][] = [
  [0, 0, 0], [0.9, 0.5, 0.3], [-0.7, 0.6, -0.4], [0.5, -0.7, 0.6],
  [-0.6, -0.5, -0.5], [0.2, 0.9, -0.6], [-0.9, 0.1, 0.5], [0.8, -0.2, -0.7],
];

const LIGAND_NODES: [number, number, number][] = [
  [0, 0, 0], [0.45, 0.2, 0], [0.22, 0.42, 0.1], [-0.3, 0.15, -0.2],
];
const LIGAND_BONDS: [number, number][] = [[0, 1], [1, 2], [0, 3]];

function Receptor() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.12;
  });
  return (
    <group ref={group}>
      {RECEPTOR_NODES.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.34, 20, 20]} />
          <meshStandardMaterial color="#123B7A" roughness={0.4} metalness={0.25} transparent opacity={0.88} />
        </mesh>
      ))}
      {/* pulsing scan ring around the binding pocket */}
      <ScanRing />
    </group>
  );
}

function ScanRing() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    const t = (state.clock.elapsedTime % 2.4) / 2.4;
    ring.current.scale.setScalar(0.6 + t * 1.8);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - t);
  });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.95, 1.02, 64]} />
      <meshBasicMaterial color="#10B981" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Ligand() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    // orbit-and-approach: circles the receptor while slowly tightening its
    // radius, then holds near the pocket - a "search converging on a match"
    const t = state.clock.elapsedTime;
    const cycle = (t % 6) / 6;
    const radius = 3.2 - Math.min(cycle * 2, 1) * 1.4;
    const angle = t * 0.9;
    group.current.position.set(Math.cos(angle) * radius, Math.sin(t * 0.6) * 0.4, Math.sin(angle) * radius);
    group.current.rotation.y = t * 0.8;
  });
  return (
    <group ref={group}>
      {LIGAND_BONDS.map(([a, b], i) => {
        const from = new THREE.Vector3(...LIGAND_NODES[a]);
        const to = new THREE.Vector3(...LIGAND_NODES[b]);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        const dir = to.clone().sub(from);
        const len = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.035, 0.035, len, 6]} />
            <meshStandardMaterial color="#6EE7B7" roughness={0.5} />
          </mesh>
        );
      })}
      {LIGAND_NODES.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.5} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  const bg = useMemo(() => new THREE.Color("#0A1628"), []);
  return (
    <>
      <color attach="background" args={[bg]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={50} color="#10B981" />
      <pointLight position={[-4, -2, -4]} intensity={35} color="#1B4B94" />
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <Receptor />
      </Float>
      <Ligand />
      <Sparkles count={50} scale={7} size={1.4} speed={0.25} color="#34D399" opacity={0.35} />
    </>
  );
}

export default function TargetLockScene() {
  return (
    <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl border border-navy-900/20 overflow-hidden shadow-2xl shadow-navy-950/20">
      <Canvas camera={{ position: [0, 0.6, 5.4], fov: 42 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-navy-950/60 to-transparent pointer-events-none" />
      <div className="absolute top-4 left-4 font-mono text-[11px] text-emerald-400/90 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        binding site search — live
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[11px] text-white/50">target.pdb · ligand.sdf</div>
    </div>
  );
}
