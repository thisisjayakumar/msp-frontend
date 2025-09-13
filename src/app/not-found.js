import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white/20 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Go Home
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
