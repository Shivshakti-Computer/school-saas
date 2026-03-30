// FILE: src/components/marketing/Container.tsx

interface ContainerProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function Container({
  children,
  className = '',
  as: Component = 'div',
}: ContainerProps) {
  return (
    <Component className={`container-custom ${className}`}>
      {children}
    </Component>
  )
}