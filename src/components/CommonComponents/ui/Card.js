import { cn } from "@/lib/utils";

/**
 * Card component with Microspring theme styling
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 * @returns {JSX.Element} Card component
 */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-lg backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header component
 */
export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Title component
 */
export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn("text-2xl font-bold leading-none tracking-tight text-slate-900", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Card Description component
 */
export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-600", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Card Content component
 */
export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer component
 */
export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
