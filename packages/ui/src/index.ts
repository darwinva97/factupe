/**
 * @factupe/ui
 *
 * UI component library for Factupe built with shadcn/ui and Radix.
 * Provides reusable, accessible components for the billing system.
 *
 * @packageDocumentation
 * @module ui
 *
 * @example
 * ```tsx
 * import { Button, Card, CardHeader, CardTitle } from '@factupe/ui'
 *
 * function MyComponent() {
 *   return (
 *     <Card>
 *       <CardHeader>
 *         <CardTitle>Invoice Details</CardTitle>
 *       </CardHeader>
 *       <Button>Create Invoice</Button>
 *     </Card>
 *   )
 * }
 * ```
 */

// Components
export { Button, buttonVariants, type ButtonProps } from './components/button'
export { Input, type InputProps } from './components/input'
export { Label } from './components/label'
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/card'
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog'
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './components/select'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/table'
export { Badge, badgeVariants, type BadgeProps } from './components/badge'

// Utilities
export { cn, formatCurrency, formatDate, formatDocument } from './lib/utils'
