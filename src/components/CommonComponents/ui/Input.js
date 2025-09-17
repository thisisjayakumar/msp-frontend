import { cn } from "@/lib/utils";

/**
 * Input component with Microspring theme styling
 * @param {Object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.error - Error message
 * @returns {JSX.Element} Input component
 */
export default function Input({
  className,
  type = "text",
  placeholder,
  disabled = false,
  error,
  ...props
}) {
  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
