import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-cyan-500">404</p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white">Back home</Link>
    </div>
  );
}
