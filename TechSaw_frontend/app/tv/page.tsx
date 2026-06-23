"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  PenTool,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";

type Inquiry = {
  id: string;
  client_name: string;
  job_material: string;
  job_dimension: string;
  machine_type: string;
  status: string;
  created_at: string;
};

type Pulse = {
  id: string;
  status: "RUNNING" | "STOPPED";
  blocker_reason: string | null;
  last_status_change_at: string;
  machine: { name: string; hourly_rate: number };
  order: { display_id: string; client_name: string };
};

export default function CommandCenterTV() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [now, setNow] = useState(Date.now());

  // 1. Fetching Logic (Polling both endpoints)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inqRes, pulseRes] = await Promise.all([
          fetch("${process.env.NEXT_PUBLIC_API_URL}/api/inquiries"),
          fetch("http://127.0.0.1:8000/api/pulse/live"),
        ]);

        if (inqRes.ok) setInquiries(await inqRes.json());
        if (pulseRes.ok) setPulses(await pulseRes.json());
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // 2. Ticking the local clock every 1 second
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // Time format helper
  const formatTime = (ms: number, showSeconds: boolean = false) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (showSeconds)
      return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    return `${h}h ${m}m`;
  };

  // Data processing
  const stats = {
    new: inquiries.filter((i) => i.status === "NEW").length,
    quoted: inquiries.filter((i) => i.status === "QUOTED").length,
    inDesign: inquiries.filter((i) => i.status === "IN_DESIGN"),
    inProduction: inquiries.filter((i) => i.status === "IN_PRODUCTION").length,
  };

  const stoppedMachines = pulses.filter((p) => p.status === "STOPPED");
  const runningMachines = pulses.filter((p) => p.status === "RUNNING");

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans p-6 flex flex-col">
      {/* HEADER */}

      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {process.env.NEXT_PUBLIC_CLIENT_NAME}{" "}
              <span className="text-indigo-400">Command Center</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
              Smart Factory Pipeline · TechSaw OS
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono tracking-tighter text-white">
            {new Date(now).toLocaleTimeString("en-IN", { hour12: true })}
          </div>
          <div className="text-slate-400 font-medium text-sm mt-1">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* COLUMN 1: SALES PIPELINE (3 Cols) */}
        <div className="col-span-3 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Sales Pipeline
          </h2>

          <Link href="/sales" className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden hover:border-slate-700 transition-colors">
              <div className="absolute top-0 w-full h-1 bg-blue-500"></div>
              <span className="text-7xl font-black text-white mb-2">
                {stats.new}
              </span>
              <span className="text-slate-400 text-lg font-bold uppercase tracking-wider">
                New Inquiries
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden hover:border-slate-700 transition-colors">
              <div className="absolute top-0 w-full h-1 bg-amber-500"></div>
              <span className="text-7xl font-black text-white mb-2">
                {stats.quoted}
              </span>
              <span className="text-slate-400 text-lg font-bold uppercase tracking-wider">
                Quotes Pending
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden hover:border-slate-700 transition-colors">
              <div className="absolute top-0 w-full h-1 bg-green-500"></div>
              <span className="text-7xl font-black text-white mb-2">
                {stats.inProduction}
              </span>
              <span className="text-slate-400 text-lg font-bold uppercase tracking-wider">
                Active Floor Jobs
              </span>
            </div>
          </Link>
        </div>

        {/* COLUMN 2: ENGINEERING BOTTLENECK (4 Cols) */}
        <div className="col-span-4 flex flex-col min-h-0">
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PenTool className="w-5 h-5" /> Active Design Queue
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1 overflow-hidden flex flex-col gap-3">
            {stats.inDesign.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 font-medium text-xl">
                Engineering queue is clear.
              </div>
            ) : (
              stats.inDesign.map((job) => {
                const daysOld = Math.floor(
                  (now - new Date(job.created_at).getTime()) /
                    (1000 * 3600 * 24),
                );
                return (
                  <div
                    key={job.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {job.client_name}
                      </h3>
                      <div className="text-slate-400 text-sm mt-1">
                        {job.job_dimension} ·{" "}
                        {job.machine_type.replace("_", " ")}
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${daysOld > 2 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-300"}`}
                    >
                      <Clock className="w-4 h-4" />
                      {daysOld} Days
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: LIVE SHOP FLOOR (5 Cols) */}
        <div className="col-span-5 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-4 shrink-0">
            <h2 className="text-xl font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5" /> Floor Pulse
            </h2>
          </div>
          
          {/* NEW SPLIT GRID: 3 cols for Alerts, 2 cols for Running */}
          <div className="flex-1 min-h-0 grid grid-cols-5 gap-6">
            
            {/* LEFT SIDE: BLOCKED MACHINES (3 Cols) */}
            <div className="col-span-3 flex flex-col gap-3 overflow-y-auto pb-6 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              {stoppedMachines.length === 0 ? (
                <div className="h-full border-2 border-slate-800 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-500 font-medium p-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-slate-700 mb-2" />
                  No active blockers. All assigned machines are running.
                </div>
              ) : (
                stoppedMachines.map((pulse) => {
                  const elapsedMs = Math.max(0, now - new Date(pulse.last_status_change_at).getTime());
                  return (
                    <div key={pulse.id} className="bg-red-950/40 border-2 border-red-900/50 rounded-2xl p-5 relative overflow-hidden shrink-0">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse"></div>
                      {/* Top row: machine name + time lost */}
                      <div className="flex justify-between items-center gap-4">
                        <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 truncate">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <span className="truncate">{pulse.machine.name}</span>
                        </h3>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-red-500/70 uppercase tracking-wider mb-0.5">Time Lost</div>
                          <div className="text-2xl font-black text-red-400 tabular-nums animate-pulse leading-none">{formatTime(elapsedMs, true)}</div>
                        </div>
                      </div>
                      {/* Client name */}
                      <p className="text-red-300/70 font-medium text-sm mt-2 truncate">{pulse.order.client_name}</p>
                      {/* Blocker badge */}
                      <div className="mt-3 px-3 py-1.5 bg-red-900/40 text-red-300 border border-red-800/50 rounded text-xs font-bold uppercase tracking-wider inline-block max-w-full truncate">
                        {pulse.blocker_reason}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT SIDE: RUNNING MACHINES (2 Cols) */}
            <div className="col-span-2 flex flex-col gap-3 overflow-y-auto pb-6 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="text-xs font-bold text-emerald-500/70 uppercase tracking-wider mb-1 border-b border-slate-800 pb-2">
                Active Production
              </div>
              
              {runningMachines.length === 0 ? (
                <div className="text-slate-600 text-sm font-medium mt-4">No machines currently running.</div>
              ) : (
                runningMachines.map((pulse) => (
                  <div key={pulse.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shrink-0 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-200">{pulse.machine.name}</h3>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-slate-400 text-sm truncate">{pulse.order.display_id} · {pulse.order.client_name}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 inline-flex px-2.5 py-1 rounded-md border border-emerald-500/20">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Running
                    </div>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}