'use client'

import { motion } from 'framer-motion'

interface GradientIconProps {
  icon: React.ReactNode
  gradient: string
  shadowColor?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  md: { container: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' },
  lg: { container: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
}

export default function GradientIcon({
  icon,
  gradient,
  shadowColor = 'shadow-primary-500/25',
  size = 'md',
  className = '',
}: GradientIconProps) {
  const { container } = sizeMap[size]

  return (
    <motion.div
      className={`${container} bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadowColor} ${className}`}
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {icon}
    </motion.div>
  )
}
