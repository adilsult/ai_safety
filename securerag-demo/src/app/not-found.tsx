import Link from 'next/link';
import { ShieldAlert, ArrowLeft, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid-pattern flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
          <ShieldAlert className="h-7 w-7 text-red-400" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">Route Not Found</h1>
        <p className="mt-3 text-sm text-slate-400">
          This endpoint is outside the secured demo scope. Return to the dashboard
          to continue the SecureRAG walkthrough.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/overview">
            <Button className="w-full bg-violet-600 text-white hover:bg-violet-700 sm:w-auto">
              <FlaskConical className="mr-1.5 h-4 w-4" />
              Go to Overview
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 sm:w-auto">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
