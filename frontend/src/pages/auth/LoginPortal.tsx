import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MODULE_LIST } from "@/utils/modules";
import logoSrc from "@/assets/logo.png";

export default function LoginPortal() {
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="KALRO" className="h-12 w-12 rounded-xl bg-white p-1.5 shadow-md ring-1 ring-emerald-100" />
            <div>
              <div className="text-sm font-bold text-slate-900">KALRO</div>
              <div className="text-[11px] text-slate-500">Planning, Performance & Management</div>
            </div>
          </div>
          <div className="hidden text-xs text-slate-500 md:block">
            Republic of Kenya · Ministry of Agriculture
          </div>
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            System Entry Portal
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Select the system you want to access
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            KALRO PPM is organized into three independent systems. Choose one to continue
            to its dedicated sign-in page.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {MODULE_LIST.map((mod) => (
            <Link
              key={mod.key}
              to={mod.key === "projects" ? "/" : mod.loginPath}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${mod.accent}`} />
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br ${mod.accent} text-white shadow`}>
                <mod.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{mod.label}</h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">{mod.short}</p>
              <p className="mt-3 flex-1 text-sm text-slate-600">{mod.description}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:gap-2.5 transition-all">
                Continue <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Kenya Agricultural & Livestock Research Organization · All rights reserved
        </div>
      </div>
    </div>
  );
}
