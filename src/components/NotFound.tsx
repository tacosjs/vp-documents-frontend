import { Link } from '@tanstack/react-router'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-6xl font-bold text-gray-400">404</h1>
      <p className="text-center text-gray-500">
        The page you're looking for doesn't exist.
      </p>
      <Link
        className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
        to="/"
      >
        Go home
      </Link>
    </div>
  )
}
