// FILE: src/components/marketing/Container.tsx

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`container-custom ${className}`}>
      {children}
    </div>
  )
}