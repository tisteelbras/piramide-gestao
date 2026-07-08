"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { NIVEIS, type Nivel } from "@/features/assessments/tipos";

// Pirâmide 3D de 4 níveis. Cada nível é um tronco (frustum) empilhado.
// A cor de cada tronco vai de cinza (vazio) → cor da marca (cheio),
// interpolada pelo preenchimento (0–100). Gira suavemente.

const CINZA = new THREE.Color("#dfe7ee");

function Tronco({
  yBase,
  altura,
  rBottom,
  rTop,
  cor,
  preench,
}: {
  yBase: number;
  altura: number;
  rBottom: number;
  rTop: number;
  cor: string;
  preench: number;
}) {
  // Interpola cinza → cor conforme preenchimento.
  const alvo = new THREE.Color(cor);
  const c = CINZA.clone().lerp(alvo, Math.max(0.08, preench / 100));
  const emiss = preench / 100;
  return (
    <mesh position={[0, yBase + altura / 2, 0]} castShadow receiveShadow>
      {/* cone truncado de 4 lados = pirâmide */}
      <cylinderGeometry args={[rTop, rBottom, altura, 4, 1]} />
      <meshStandardMaterial
        color={c}
        metalness={0.15}
        roughness={0.45}
        emissive={alvo}
        emissiveIntensity={emiss * 0.22}
        flatShading
      />
    </mesh>
  );
}

function Piramide({ preenchimento }: { preenchimento: Record<Nivel, number> }) {
  const grupo = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (grupo.current) grupo.current.rotation.y += dt * 0.35;
  });

  // Geometria: base larga embaixo (resultados) → topo (visão).
  // Ordem visual de baixo p/ cima: resultados, processos, tatico, visao.
  const ordem: Nivel[] = ["resultados", "processos", "tatico", "visao"];
  const alturaNivel = 0.85;
  const rBase = 2.1; // raio na base total
  const gap = 0.06;

  let y = -(alturaNivel * 4) / 2;

  return (
    <group ref={grupo} rotation={[0.15, 0, 0]}>
      {ordem.map((id, i) => {
        const meta = NIVEIS.find((n) => n.id === id)!;
        // raio diminui a cada nível para cima
        const rBottom = rBase * (1 - i / 4);
        const rTop = rBase * (1 - (i + 1) / 4);
        const yBase = y;
        y += alturaNivel + gap;
        return (
          <Tronco
            key={id}
            yBase={yBase}
            altura={alturaNivel}
            rBottom={rBottom}
            rTop={i === 3 ? 0.02 : rTop}
            cor={meta.cor}
            preench={preenchimento[id] ?? 0}
          />
        );
      })}
      {/* base / sombra */}
      <mesh position={[0, -(alturaNivel * 4) / 2 - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[rBase + 0.3, 48]} />
        <meshStandardMaterial color="#dbe6ef" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function Piramide3D({ preenchimento }: { preenchimento: Record<Nivel, number> }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: 460, margin: "0 auto" }}>
      <Canvas shadows camera={{ position: [0, 1.4, 6.2], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} castShadow />
        <directionalLight position={[-3, 2, -4]} intensity={0.4} color="#8fbce0" />
        <Piramide preenchimento={preenchimento} />
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3.5} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
