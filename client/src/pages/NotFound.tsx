import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-gray-200">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <p className="mt-1 text-sm text-gray-400">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="mt-6">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
