import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import PointerInteraction from './PointerInteraction'
import Rotator from './Rotator'
import * as THREE from 'three'
import { gsap } from 'gsap'

type Props = {
  timeLimitMinutes: number
  running: boolean
  onSolved?: () => void
  onTimeout?: () => void
}

const FACE_COLORS: Record<string, string> = {
  U: '#ffffff',
  D: '#ffff00',
  F: '#ff0000',
  B: '#ff8000',
  L: '#0000ff',
  R: '#00ff00'
}

type FaceMap = string[][]

function makeSolvedFaces(): Record<string, FaceMap> {
  const faces: Record<string, FaceMap> = {} as any
  for (const k of ['U', 'D', 'F', 'B', 'L', 'R']) {
    faces[k] = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => FACE_COLORS[k]))
  }
  return faces
}

function rotateMatrixClockwise(m: FaceMap) {
  const res: FaceMap = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ''))
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      res[c][2 - r] = m[r][c]
    }
  }
  return res
}

export default function CubeScene({ timeLimitMinutes, running, onSolved, onTimeout }: Props) {
  const [faces, setFaces] = useState<Record<string, FaceMap>>(() => makeSolvedFaces())
  const [remaining, setRemaining] = useState<number>(timeLimitMinutes * 60)
  const groupRef = useRef<THREE.Group>(null!)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // timer + tick sound
  useEffect(() => setRemaining(timeLimitMinutes * 60), [timeLimitMinutes])
  useEffect(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    let interval: any = null
    if (running) {
      interval = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            if (onTimeout) onTimeout()
            scramble()
            return timeLimitMinutes * 60
          }
          return r - 1
        })
        // tick
        const ctx = audioCtxRef.current!
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'square'
        o.frequency.value = 880
        g.gain.value = 0.02
        o.connect(g)
        g.connect(ctx.destination)
        o.start()
        setTimeout(() => o.stop(), 80)
      }, 1000)
    }
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timeLimitMinutes])

  // rotator moved into a component mounted inside Canvas (see Rotator)

  // Moves: we implement U, Ui, R, Ri, F, Fi for now
  const isAnimating = useRef(false)

  function getNextFaces(prev: Record<string, FaceMap>, move: string) {
    const f = JSON.parse(JSON.stringify(prev)) as Record<string, FaceMap>
    const rot = (face: string) => { f[face] = rotateMatrixClockwise(f[face]) }
    const rotateFaceTimes = (face: string, times = 1) => { for (let i = 0; i < times; i++) rot(face) }

    switch (move) {
      case 'U':
        rotateFaceTimes('U', 1)
        const tmp = f['F'][0].slice()
        f['F'][0] = f['R'][0].slice()
        f['R'][0] = f['B'][0].slice()
        f['B'][0] = f['L'][0].slice()
        f['L'][0] = tmp
        break
      case 'Ui':
        return getNextFaces(getNextFaces(getNextFaces(prev, 'U'), 'U'), 'U')
      case 'R':
        rotateFaceTimes('R', 1)
        for (let i = 0; i < 3; i++) {
          const t = f['U'][i][2]
          f['U'][i][2] = f['F'][i][2]
          f['F'][i][2] = f['D'][i][2]
          f['D'][i][2] = f['B'][2 - i][0]
          f['B'][2 - i][0] = t
        }
        break
      case 'Ri':
        return getNextFaces(getNextFaces(getNextFaces(prev, 'R'), 'R'), 'R')
      case 'F':
        rotateFaceTimes('F', 1)
        const top = f['U'][2].slice()
        for (let i = 0; i < 3; i++) {
          f['U'][2][i] = f['L'][2 - i][2]
          f['L'][2 - i][2] = f['D'][0][2 - i]
          f['D'][0][2 - i] = f['R'][i][0]
          f['R'][i][0] = top[i]
        }
        break
      case 'Fi':
        return getNextFaces(getNextFaces(getNextFaces(prev, 'F'), 'F'), 'F')
      default:
        break
    }

    return f
  }

  function animateLayer(move: string, callback?: () => void) {
    if (!groupRef.current || isAnimating.current) { if (callback) callback(); return }
    isAnimating.current = true
    const sceneRoot = groupRef.current.parent || groupRef.current
    const tmpGroup = new THREE.Group()
    sceneRoot.add(tmpGroup)

    // determine affected sticker name patterns
    const affected: string[] = []
    switch (move) {
      case 'U':
      case 'Ui':
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) affected.push(`U-${r}-${c}`)
        for (let c = 0; c < 3; c++) { affected.push(`F-0-${c}`); affected.push(`R-0-${c}`); affected.push(`B-0-${c}`); affected.push(`L-0-${c}`) }
        break
      case 'R':
      case 'Ri':
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) affected.push(`R-${r}-${c}`)
        for (let i = 0; i < 3; i++) { affected.push(`U-${i}-2`); affected.push(`F-${i}-2`); affected.push(`D-${i}-2`); affected.push(`B-${2 - i}-0`) }
        break
      case 'F':
      case 'Fi':
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) affected.push(`F-${r}-${c}`)
        for (let i = 0; i < 3; i++) { affected.push(`U-2-${i}`); affected.push(`R-${i}-0`); affected.push(`D-0-${2 - i}`); affected.push(`L-${2 - i}-2`) }
        break
      default:
        break
    }

    const meshes: THREE.Object3D[] = []
    affected.forEach((name) => {
      const obj = groupRef.current.getObjectByName(name)
      if (obj) meshes.push(obj)
    })

    // attach meshes to tmpGroup while preserving world transforms
    meshes.forEach((m) => tmpGroup.attach(m))

    // choose rotation axis and angle
    let axis = new THREE.Vector3(0, 1, 0)
    let angle = Math.PI / 2
    if (move.endsWith('i')) angle = -Math.PI / 2
    if (move.startsWith('R')) axis = new THREE.Vector3(1, 0, 0)
    if (move.startsWith('F')) axis = new THREE.Vector3(0, 0, 1)

    // animate
    gsap.to(tmpGroup.rotation, { x: tmpGroup.rotation.x + axis.x * angle, y: tmpGroup.rotation.y + axis.y * angle, z: tmpGroup.rotation.z + axis.z * angle, duration: 0.4, onComplete: () => {
      // reattach meshes back to original group
      meshes.forEach((m) => groupRef.current.attach(m))
      sceneRoot.remove(tmpGroup)
      isAnimating.current = false
      if (callback) callback()
    } })
  }

  function applyMove(move: string) {
    // animate layer, then update logical face state
    animateLayer(move, () => {
      setFaces((prev) => {
        const next = getNextFaces(prev, move)
        // check solved
        let solved = true
        for (const key of Object.keys(next)) {
          const col = next[key][0][0]
          for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (next[key][r][c] !== col) solved = false
        }
        if (solved && onSolved) onSolved()
        return next
      })
    })
  }

  function scramble(times = 20) {
    const moves = ['U', 'Ui', 'R', 'Ri', 'F', 'Fi']
    for (let i = 0; i < times; i++) {
      const m = moves[Math.floor(Math.random() * moves.length)]
      applyMove(m)
    }
  }

  // event listeners from DevPanel
  useEffect(() => {
    const onScr = () => scramble(30)
    const onReset = () => setFaces(makeSolvedFaces())
    const onMove = (e: any) => applyMove(e.detail)
    window.addEventListener('scramble', onScr as EventListener)
    window.addEventListener('reset-cube', onReset as EventListener)
    window.addEventListener('move', onMove as EventListener)
    return () => {
      window.removeEventListener('scramble', onScr as EventListener)
      window.removeEventListener('reset-cube', onReset as EventListener)
      window.removeEventListener('move', onMove as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const k = ev.key.toUpperCase()
      if (k === 'U' || k === 'R' || k === 'F') {
        if (ev.shiftKey) applyMove(k + 'i')
        else applyMove(k)
      }
      if (k === 'S') scramble()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const size = 2.7
  const stickerSize = 0.85
  const gap = 0.05

  function renderFaceStickers() {
    const arr: JSX.Element[] = []
    // U (+Y)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = (c - 1) * stickerSize
      const z = (1 - r) * stickerSize
      const color = faces['U'][r][c]
      arr.push(
        <mesh name={`U-${r}-${c}`} key={`U-${r}-${c}`} position={[x, size / 2 + 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[stickerSize - gap, stickerSize - gap]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )
    }
    // D (-Y)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = (c - 1) * stickerSize
      const z = (r - 1) * stickerSize
      const color = faces['D'][r][c]
      arr.push(
        <mesh name={`D-${r}-${c}`} key={`D-${r}-${c}`} position={[x, -size / 2 - 0.01, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[stickerSize - gap, stickerSize - gap]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )
    }
    // F (+Z)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = (c - 1) * stickerSize
      const y = (1 - r) * stickerSize
      const color = faces['F'][r][c]
      arr.push(
        <mesh name={`F-${r}-${c}`} key={`F-${r}-${c}`} position={[x, y, size / 2 + 0.01]} rotation={[0, 0, 0]}>
          <planeGeometry args={[stickerSize - gap, stickerSize - gap]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )
    }
    // B (-Z)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = (1 - c) * stickerSize
      const y = (1 - r) * stickerSize
      const color = faces['B'][r][c]
      arr.push(
        <mesh name={`B-${r}-${c}`} key={`B-${r}-${c}`} position={[x, y, -size / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[stickerSize - gap, stickerSize - gap]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )
    }
    // L (-X)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const z = (1 - c) * stickerSize
      const y = (1 - r) * stickerSize
      const color = faces['L'][r][c]
      arr.push(
        <mesh name={`L-${r}-${c}`} key={`L-${r}-${c}`} position={[-size / 2 - 0.01, y, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[stickerSize - gap, stickerSize - gap]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )
    }
    // R (+X)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const z = (c - 1) * stickerSize
      const y = (1 - r) * stickerSize
      const color = faces['R'][r][c]
      arr.push(
        <mesh name={`R-${r}-${c}`} key={`R-${r}-${c}`} position={[size / 2 + 0.01, y, z]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[stickerSize - gap, stickerSize - gap]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )
    }

    return arr
  }

    
  return (
    <div className="scene-shell">
      <Canvas camera={{ position: [4, 4, 6] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <group ref={groupRef}>
          {/* base cube */}
          <mesh>
            <boxGeometry args={[2.7, 2.7, 2.7]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {renderFaceStickers()}
          <PointerInteraction groupRef={groupRef} applyMove={applyMove} />
          <Rotator groupRef={groupRef} />
        </group>
        <OrbitControls enablePan={false} />
      </Canvas>
      <div className="hud">
        <div>Time: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</div>
      </div>
    </div>
  )
}
