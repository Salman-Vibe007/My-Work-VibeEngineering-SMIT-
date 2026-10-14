import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-border-medium bg-neutral-100 text-text-primary',
        secondary: 'border border-border-medium bg-neutral-100 text-text-primary',
        destructive: 'border border-error-500 bg-error-50 text-error-900',
        success: 'border border-success-500 bg-success-50 text-success-900',
        warning: 'border border-warning-500 bg-warning-50 text-warning-900',
        primary: 'border border-primary-500 bg-primary-50 text-primary-900',
        outline: 'border border-border-medium text-text-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }