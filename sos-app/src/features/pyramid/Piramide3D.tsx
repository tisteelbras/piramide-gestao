"use client";

import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Billboard, Text } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { NIVEIS, type Nivel } from "@/features/assessments/tipos";

// Pirâmide 3D de 4 níveis. Cada nível é um tronco (frustum) empilhado.
//
// Cada nível funciona como um MEDIDOR vertical:
//  - a fatia de baixo, proporcional ao concluído, fica na cor da marca (sólida);
//  - a fatia de cima, proporcional ao que FALTA, fica avermelhada translúcida,
//    com uma linha divisória sutil. 100% = nível todo na cor; 0% = todo vermelho.
//  - Rótulo de % em 3D ao lado de cada nível (billboard: sempre de frente).
//  - Hover destaca só a ala sob o mouse (acende + sobe levemente).
//  - Clique navega para a avaliação DAQUELE nível (se setorId).
//  - Rotação pausa no hover e respeita prefers-reduced-motion.

const CINZA = new THREE.Color("#eef3f8");
const FALTA_COR = new THREE.Color("#e8827f"); // vermelho suave (não "sangue")
const ordem: Nivel[] = ["resultados", "processos", "tatico", "visao"];

// Interpola o raio do frustum a uma dada fração de altura do tronco (0=base, 1=topo).
function raioEm(rBottom: number, rTop: number, t: number) {
  return rBottom + (rTop - rBottom) * t;
}

function Tronco({
  yBase,
  altura,
  rBottom,
  rTop,
  cor,
  preench,
  clicavel,
  ativo,
  onClick,
  onHover,
}: {
  yBase: number;
  altura: number;
  rBottom: number;
  rTop: number;
  cor: string;
  preench: number;
  clicavel: boolean;
  ativo: boolean;
  onClick?: () => void;
  onHover: (dentro: boolean) => void;
}) {
  const alvo = useMemo(() => new THREE.Color(cor), [cor]);
  const corFeito = useMemo(() => CINZA.clone().lerp(alvo, 0.92), [alvo]);
  const frac = Math.max(0, Math.min(1, preench / 100)); // fração concluída

  const hFeito = altura * frac;
  const hFalta = altura - hFeito;
  const rDiv = raioEm(rBottom, rTop, frac);

  // Anima o grupo: a ala sob o mouse sobe e escala levemente.
  const grupoRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!grupoRef.current) return;
    const alvoScale = ativo ? 1.06 : 1;
    const alvoY = yBase + (ativo ? 0.12 : 0);
    grupoRef.current.scale.x += (alvoScale - grupoRef.current.scale.x) * 0.18;
    grupoRef.current.scale.z += (alvoScale - grupoRef.current.scale.z) * 0.18;
    grupoRef.current.position.y += (alvoY - grupoRef.current.position.y) * 0.18;
  });

  const emissFeito = ativo ? 0.35 : 0.14;

  return (
    <group
      ref={grupoRef}
      position={[0, yBase, 0]}
      onClick={clicavel ? (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick?.(); } : undefined}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(false); }}
    >
      {/* Fatia concluída (cor da marca) */}
      {hFeito > 0.001 && (
        <mesh position={[0, hFeito / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[rDiv, rBottom, hFeito, 4, 1]} />
          <meshStandardMaterial
            color={corFeito}
            metalness={0.12}
            roughness={0.5}
            emissive={alvo}
            emissiveIntensity={emissFeito}
            flatShading
          />
        </mesh>
      )}

      {/* Fatia faltante (vermelho translúcido, aspecto de "vidro fosco") */}
      {hFalta > 0.001 && (
        <mesh position={[0, hFeito + hFalta / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[rTop, rDiv, hFalta, 4, 1]} />
          <meshStandardMaterial
            color={FALTA_COR}
            metalness={0.05}
            roughness={0.65}
            transparent
            opacity={ativo ? 0.74 : 0.62}
            flatShading
          />
        </mesh>
      )}

      {/* Linha divisória sutil entre feito e falta */}
      {hFeito > 0.001 && hFalta > 0.001 && (
        <mesh position={[0, hFeito, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[rDiv * 0.7, rDiv * 1.02, 4]} />
          <meshBasicMaterial color="#c0504d" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Contorno de destaque quando a ala está ativa (hover). */}
      {ativo && (
        <mesh position={[0, altura / 2, 0]}>
          <cylinderGeometry args={[rTop + 0.03, rBottom + 0.03, altura + 0.02, 4, 1]} />
          <meshBasicMaterial color={cor} wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function RotuloPercentual({
  y,
  x,
  valor,
  cor,
  ativo,
}: {
  y: number;
  x: number;
  valor: number;
  cor: string;
  ativo: boolean;
}) {
  const preenchido = valor > 0;
  return (
    <Billboard position={[x, y, 0]}>
      <Text
        fontSize={ativo ? 0.48 : 0.4}
        color={preenchido ? cor : "#9aa8b4"}
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.014}
        outlineColor="#ffffff"
        fontWeight="bold"
      >
        {`${Math.round(valor)}%`}
      </Text>
    </Billboard>
  );
}

function Piramide({
  preenchimento,
  setorId,
  ativo,
  setAtivo,
}: {
  preenchimento: Record<Nivel, number>;
  setorId?: string;
  ativo: Nivel | null;
  setAtivo: (n: Nivel | null) => void;
}) {
  const grupo = useRef<THREE.Group>(null);
  const router = useRouter();

  const reduzMovimento = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useFrame((_, dt) => {
    if (grupo.current && !ativo && !reduzMovimento) {
      grupo.current.rotation.y += dt * 0.3;
    }
  });

  const alturaNivel = 0.85;
  const rBase = 2.0;
  const gap = 0.06;
  const yInicio = -(alturaNivel * 4) / 2;

  const niveis = ordem.map((id, i) => {
    const rBottom = rBase * (1 - i / 4);
    const rTop = i === 3 ? 0.02 : rBase * (1 - (i + 1) / 4);
    const yBase = yInicio + i * (alturaNivel + gap);
    return { id, i, rBottom, rTop, yBase };
  });

  return (
    <group ref={grupo} rotation={[0.16, 0, 0]}>
      {niveis.map(({ id, rBottom, rTop, yBase }) => {
        const meta = NIVEIS.find((n) => n.id === id)!;
        const preench = preenchimento[id] ?? 0;
        return (
          <Tronco
            key={id}
            yBase={yBase}
            altura={alturaNivel}
            rBottom={rBottom}
            rTop={rTop}
            cor={meta.cor}
            preench={preench}
            clicavel={!!setorId}
            ativo={ativo === id}
            onClick={setorId ? () => router.push(`/setor/${setorId}/avaliar#${id}`) : undefined}
            onHover={(dentro) => setAtivo(dentro ? id : null)}
          />
        );
      })}

      {/* Rótulos de % à direita de cada nível. */}
      {niveis.map(({ id, rBottom, yBase }) => {
        const meta = NIVEIS.find((n) => n.id === id)!;
        return (
          <RotuloPercentual
            key={`rot-${id}`}
            x={rBottom + 0.3}
            y={yBase + alturaNivel / 2}
            valor={preenchimento[id] ?? 0}
            cor={meta.cor}
            ativo={ativo === id}
          />
        );
      })}

      {/* base / sombra */}
      <mesh position={[0, yInicio - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[rBase + 0.3, 48]} />
        <meshStandardMaterial color="#dbe6ef" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

export default function Piramide3D({
  preenchimento,
  setorId,
}: {
  preenchimento: Record<Nivel, number>;
  setorId?: string;
}) {
  const [ativo, setAtivo] = useState<Nivel | null>(null);
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        maxWidth: 460,
        margin: "0 auto",
        cursor: setorId && ativo ? "pointer" : "default",
      }}
    >
      <Canvas shadows camera={{ position: [0, 1.2, 7.4], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 4]} intensity={1.05} castShadow />
        <directionalLight position={[-3, 2, -4]} intensity={0.4} color="#8fbce0" />
        <Piramide preenchimento={preenchimento} setorId={setorId} ativo={ativo} setAtivo={setAtivo} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
