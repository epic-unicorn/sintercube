import React, { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

export default function PointerInteraction({ groupRef, applyMove }: { groupRef: React.RefObject<THREE.Group>; applyMove: (m: string) => void }) {
  const { gl, camera } = useThree()
  useEffect(() => {
    const raycaster = new THREE.Raycaster()
    let startPoint: { x: number; y: number } | null = null
    let startHitName: string | null = null

    function getIntersects(clientX: number, clientY: number) {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -((clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      const intersects = raycaster.intersectObjects([groupRef.current], true)
      return intersects
    }

    function onPointerDown(e: PointerEvent) {
      startPoint = { x: e.clientX, y: e.clientY }
      const hits = getIntersects(e.clientX, e.clientY)
      if (hits.length) startHitName = (hits[0].object as any).name || null
      else startHitName = null
    }

    function onPointerUp(e: PointerEvent) {
      if (!startPoint) return
      const dx = e.clientX - startPoint.x
      const dy = e.clientY - startPoint.y
      const dist = Math.hypot(dx, dy)
      const hits = getIntersects(e.clientX, e.clientY)
      const endHitName = hits.length ? (hits[0].object as any).name : null

      if (!startHitName) { startPoint = null; startHitName = null; return }
      if (dist < 10) {
        const face = startHitName.split('-')[0]
        if (face) applyMove(face)
      } else {
        const face = startHitName.split('-')[0]
        if (face === 'U') {
          if (Math.abs(dx) > Math.abs(dy)) applyMove(dx < 0 ? 'Ui' : 'U')
        } else if (face === 'R') {
          if (Math.abs(dy) > Math.abs(dx)) applyMove(dy < 0 ? 'R' : 'Ri')
        } else if (face === 'F') {
          if (Math.abs(dx) > Math.abs(dy)) applyMove(dx < 0 ? 'Fi' : 'F')
        } else if (face === 'L') {
          if (Math.abs(dy) > Math.abs(dx)) applyMove(dy < 0 ? 'Ri' : 'R')
        } else if (face === 'D') {
          if (Math.abs(dx) > Math.abs(dy)) applyMove(dx < 0 ? 'U' : 'Ui')
        } else if (face === 'B') {
          if (Math.abs(dx) > Math.abs(dy)) applyMove(dx < 0 ? 'F' : 'Fi')
        }
      }

      startPoint = null
      startHitName = null
    }

    gl.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      gl.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl, camera, groupRef, applyMove])

  return null
}
