import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered'
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-white shadow-lg',
    bordered: 'bg-white border border-gray-200',
  }

  return (
    <div
      className={`rounded-xl p-6 ${variants[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  )
}
