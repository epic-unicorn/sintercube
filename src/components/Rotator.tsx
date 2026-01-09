import React from 'react'
import { useFrame } from '@react-three/fiber'

export default function Rotator({ groupRef }: { groupRef: React.RefObject<any> }) {
  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.001
  })
  return null
}
