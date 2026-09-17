import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, LayoutDashboard, Compass } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-slate-800 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl">
        {/* Decorative Compass Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
          <Compass className="h-8 w-8 text-white animate-spin" style={{ animationDuration: "12s" }} />
        </div>

        {/* 404 Text */}
        <div className="space-y-2">
          <p className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 tracking-tighter">
            404
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Page Not Found</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The page you are looking for does not exist or may have been relocated.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto px-6 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
