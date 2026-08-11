"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Euler, Quaternion, Vector3 } from "three";

/** A simple ball-and-stick representation of caffeine's heavy-atom skeleton,
 * positioned by hand from its known connectivity — swap for real PDB/SDF-driven
 * coordinates (parsed server-side by drug-service) once a compound is selected
 * from the library in Stage 3. */
const ATOMS: { pos: [number, number, number]; color: string; label: string }[] = [
  { pos: [0, 0, 0], color: "#0B3D91", label: "C" },
  { pos: [1.2, 0.6, 0], color: "#0B3D91", label: "C" },
  { pos: [2.3, -0.1, 0.4], color: "#10B981", label: "N" },
  { pos: [2.1, -1.4, 0.9], color: "#0B3D91", label: "C" },
  { pos: [0.8, -1.9, 0.8], color: "#10B981", label: "N" },
  { pos: [-0.2, -1.1, 0.3], color: "#0B3D91", label: "C" },
  { pos: [-1.5, -1.4, 0.2], color: "#E11D48", label: "O" },
  { pos: [1.1, 1.9, -0.4], color: "#10B981", label: "N" },
  { pos: [-0.9, 0.7, -0.3], color: "#10B981", label: "N" },
];

const BONDS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [5, 6], [1, 7], [0, 8],
];

function Atom({ pos, color }: { pos: [number, number, number]; color: string }) {
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.26, 24, 24]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
    </mesh>
  );
}

function Bond({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const dir = { x: dx / length, y: dy / length, z: dz / length };

  const quaternion = new Quaternion().setFromAxisAngle(new Vector3(-dir.z, 0, dir.x).normalize(), Math.acos(dir.y));
  const rotation = new Euler().setFromQuaternion(quaternion);

  return (
    <mesh position={mid} rotation={rotation}>
      <cylinderGeometry args={[0.06, 0.06, length, 8]} />
      <meshStandardMaterial color="#CBD5E1" roughness={0.6} />
    </mesh>
  );
}

function MoleculeModel() {
  return (
    <group rotation={[0.3, 0.4, 0]}>
      {BONDS.map(([a, b], i) => (
        <Bond key={i} from={ATOMS[a].pos} to={ATOMS[b].pos} />
      ))}
      {ATOMS.map((atom, i) => (
        <Atom key={i} pos={atom.pos} color={atom.color} />
      ))}
    </group>
  );
}

export default function MolecularWorkspace() {
  return (
    <div className="relative w-full h-[420px] rounded-2xl border border-surface-border bg-navy-950 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={60} color="#10B981" />
        <pointLight position={[-5, -3, -5]} intensity={30} color="#0B3D91" />
        <Suspense fallback={null}>
          <MoleculeModel />
        </Suspense>
        <OrbitControls enableZoom autoRotate autoRotateSpeed={1.2} enablePan={false} />
      </Canvas>
      <div className="absolute bottom-4 left-4 font-mono text-[11px] text-emerald-400">
        drag to rotate · scroll to zoom
      </div>
      <div className="absolute top-4 right-4 font-mono text-[11px] text-white/70">caffeine.sdf</div>
    </div>
  );
}
