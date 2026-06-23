"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  PlayCircle,
  StopCircle,
  ClipboardList,
  ArrowDownCircle,
  CheckCircle2,
} from "lucide-react";

type Pulse = {
  id: string;
  status: "RUNNING" | "STOPPED";
  blocker_reason: string | null;
  last_status_change_at: string;
  machine: { name: string };
  order: { id: string; display_id: string; client_name: string };
};

type Drawing = {
  id: string;
  client_name: string;
  job_material: string;
  job_dimension: string;
};

// In your floor component:
const BLOCKER_REASONS = process.env.NEXT_PUBLIC_BLOCKER_REASONS?.split(",") || [
  "Stopped",
];

export default function FloorKiosk() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [haltingPulseId, setHaltingPulseId] = useState<string | null>(null);
  const [assigningPulseId, setAssigningPulseId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [pulseRes, drawRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pulse/live`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/floor/drawings`),
      ]);
      if (pulseRes.ok) setPulses(await pulseRes.json());
      if (drawRes.ok) setDrawings(await drawRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // API Call: Halt
  const handleHalt = async (id: string, reason: string) => {
    setHaltingPulseId(null);
    await fetch(`http://127.0.0.1:8000/api/pulse/${id}/block`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocker_reason: reason }),
    });
    fetchData();
  };

  // API Call: Resume
  const handleResume = async (id: string) => {
    await fetch(`http://127.0.0.1:8000/api/pulse/${id}/resume`, {
      method: "POST",
    });
    fetchData();
  };

  // API Call: Assign New Drawing
  const handleAssignJob = async (pulseId: string, inquiryId: string) => {
    setAssigningPulseId(null);
    await fetch(
      `http://127.0.0.1:8000/api/pulse/${pulseId}/assign/${inquiryId}`,
      { method: "POST" },
    );
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans select-none overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Shop Floor Terminal
          </h1>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg font-bold text-slate-300">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            {drawings.length} Drawings Ready
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pulses.map((pulse) => {
            const isStopped = pulse.status === "STOPPED";
            const isHalting = haltingPulseId === pulse.id;
            const isAssigning = assigningPulseId === pulse.id;

            return (
              <div
                key={pulse.id}
                className={`flex flex-col justify-between rounded-2xl p-6 border-4 transition-all min-h-[320px] ${isStopped ? "bg-red-950/30 border-red-600" : "bg-slate-800 border-slate-700"}`}
              >
                {/* 1. Header & Current Job */}
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-black mb-1">
                      {pulse.machine.name}
                    </h2>
                    {!isAssigning && !isStopped && !isHalting && (
                      <button
                        onClick={() => setAssigningPulseId(pulse.id)}
                        className="text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                      >
                        <ArrowDownCircle className="w-4 h-4" /> Load New
                      </button>
                    )}
                  </div>

                  {/* Current Active Job Display */}
                  {!isAssigning && (
                    <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                        Current Job
                      </div>
                      <p className="text-slate-200 font-medium text-lg">
                        {pulse.order.display_id} · {pulse.order.client_name}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. The Interaction Layer */}
                <div className="mt-auto">
                  {/* View: Assignment Menu */}
                  {isAssigning && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
                      <div className="text-slate-300 font-bold mb-2 flex items-center gap-2 border-b border-slate-700 pb-2">
                        <ClipboardList className="w-4 h-4" /> Select Drawing to
                        Start:
                      </div>
                      <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                        {drawings.length === 0 ? (
                          <div className="text-slate-500 text-sm text-center py-4">
                            No new drawings available.
                          </div>
                        ) : (
                          drawings.map((draw) => (
                            <button
                              key={draw.id}
                              onClick={() => handleAssignJob(pulse.id, draw.id)}
                              className="w-full p-3 bg-slate-700 hover:bg-indigo-600 active:bg-indigo-700 text-left rounded-lg border border-slate-600 transition-colors group"
                            >
                              <div className="font-bold text-white group-hover:text-white">
                                {draw.client_name}
                              </div>
                              <div className="text-xs text-slate-400 group-hover:text-indigo-100 mt-1">
                                {draw.job_dimension} · {draw.job_material}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <button
                        onClick={() => setAssigningPulseId(null)}
                        className="w-full py-3 mt-2 text-slate-400 hover:text-slate-200 font-bold bg-slate-900 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* View: Stopped Alert */}
                  {isStopped && !isAssigning && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-red-900/50 text-red-200 p-4 rounded-xl font-bold flex items-center gap-3 text-lg border border-red-700/50">
                        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                        {pulse.blocker_reason}
                      </div>
                      <button
                        onClick={() => handleResume(pulse.id)}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xl rounded-xl shadow-lg flex items-center justify-center gap-3 transition-colors"
                      >
                        <PlayCircle className="w-7 h-7" /> RESUME WORK
                      </button>
                    </div>
                  )}

                  {/* View: Halting Menu */}
                  {!isStopped && isHalting && !isAssigning && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4">
                      <div className="text-slate-300 font-bold mb-2">
                        Select Blocker Reason:
                      </div>
                      {BLOCKER_REASONS.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => handleHalt(pulse.id, reason)}
                          className="w-full py-4 px-4 bg-slate-700 hover:bg-slate-600 text-left font-bold text-lg rounded-xl border border-slate-600 transition-colors"
                        >
                          {reason}
                        </button>
                      ))}
                      <button
                        onClick={() => setHaltingPulseId(null)}
                        className="w-full py-4 mt-2 text-slate-400 font-bold bg-slate-900 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* View: Default Running State */}
                  {!isStopped && !isHalting && !isAssigning && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHaltingPulseId(pulse.id)}
                        className="flex-1 py-4 bg-slate-700/80 hover:bg-slate-600 active:bg-slate-800 text-slate-300 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-600"
                      >
                        <StopCircle className="w-5 h-5" /> HALT
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              "Are you sure this job is 100% complete?",
                            )
                          ) {
                            await fetch(
                              `http://127.0.0.1:8000/api/pulse/${pulse.id}/complete/${pulse.order.id}`,
                              { method: "POST" },
                            );
                            fetchData();
                          }
                        }}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                      >
                        <CheckCircle2 className="w-5 h-5" /> FINISH JOB
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
