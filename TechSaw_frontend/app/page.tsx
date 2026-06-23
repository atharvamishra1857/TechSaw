"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, StopCircle, PlayCircle } from "lucide-react";

type Pulse = {
  id: string;
  status: "RUNNING" | "STOPPED";
  blocker_reason: string | null;
  last_status_change_at: string;
  machine: { id: string; name: string; hourly_rate: number };
  order: { id: string; display_id: string; client_name: string };
};

// Hardcoded blocker reasons so the supervisor never has to type.
const BLOCKER_REASONS = [
  "Waiting: Raw Material",
  "Waiting: Supervisor Approval / Tooling",
  "Waiting: External Vendor Return",
  "Machine Breakdown",
  "Operator Absent",
];

export default function FloorPulseDashboard() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [now, setNow] = useState(Date.now());
  const [haltingPulseId, setHaltingPulseId] = useState<string | null>(null);

  // 1. Fetching Logic (Wrapped in useCallback to reuse after tapping)
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/pulse/live");
      if (res.ok) {
        const data = await res.json();
        setPulses(data);
      }
    } catch (err) {
      console.error("Failed to fetch pulse data", err);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  // 2. The API Call: Mark Machine as STOPPED
  const handleHaltMachine = async (pulseId: string, reason: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/pulse/${pulseId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocker_reason: reason }),
      });
      setHaltingPulseId(null); // Close the menu
      fetchData(); // Instantly refresh the board
    } catch (err) {
      console.error("Failed to halt machine", err);
    }
  };

  // 3. The API Call: Mark Machine as RUNNING
  const handleResumeMachine = async (pulseId: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/pulse/${pulseId}/resume`, {
        method: "POST",
      });
      fetchData(); // Instantly refresh the board
    } catch (err) {
      console.error("Failed to resume machine", err);
    }
  };

  const formatTime = (ms: number, showSeconds: boolean = false) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (showSeconds) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    return `${h}h ${m}m`;
  };

  const sortedPulses = [...pulses].sort((a, b) => {
    if (a.status === "STOPPED" && b.status === "RUNNING") return -1;
    if (a.status === "RUNNING" && b.status === "STOPPED") return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 tracking-tight">Live Floor Pulse</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPulses.map((pulse, index) => {
            const isStopped = pulse.status === "STOPPED";
            const isSevere = isStopped && index === 0;
            const startTime = new Date(pulse.last_status_change_at).getTime();
            const elapsedMs = Math.max(0, now - startTime);
            const idleCost = Math.round((elapsedMs / 3600000) * pulse.machine.hourly_rate);
            const isHaltingMenuOpen = haltingPulseId === pulse.id;

            return (
              <div
                key={pulse.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSevere 
                    ? "bg-red-50 border-red-200 md:col-span-2 shadow-sm" 
                    : "bg-white border-gray-200 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {pulse.machine.name}
                        <span className="text-gray-500 font-normal text-sm">
                          · {pulse.order.display_id}, {pulse.order.client_name}
                        </span>
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-gray-600 font-medium">
                        <span className="relative flex h-2.5 w-2.5 mr-2">
                          {isStopped && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSevere ? "bg-red-500" : "bg-amber-500"}`}></span>}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStopped ? (isSevere ? "bg-red-500" : "bg-amber-500") : "bg-green-500"}`}></span>
                        </span>
                        {isStopped ? "Stopped" : "Running · On track"}
                      </div>
                    </div>
                  </div>

                  {isStopped && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium mb-4 ${isSevere ? "bg-white text-red-700 border border-red-200" : "bg-amber-100 text-amber-800"}`}>
                      <AlertTriangle className="w-4 h-4" />
                      {pulse.blocker_reason}
                    </div>
                  )}

                  {isStopped && (
                    <div className={`flex items-baseline gap-8 mb-4 ${isSevere ? "flex-wrap" : ""}`}>
                      <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Idle For</div>
                        <div className={`font-semibold tabular-nums ${isSevere ? "text-3xl text-red-600" : "text-xl text-gray-900"}`}>
                          {formatTime(elapsedMs, isSevere)}
                        </div>
                      </div>
                      {pulse.machine.hourly_rate > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Overhead Cost</div>
                          <div className={`font-semibold tabular-nums ${isSevere ? "text-3xl text-red-600" : "text-xl text-gray-900"}`}>
                            ≈ ₹{idleCost.toLocaleString("en-IN")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Supervisor Controls Layer */}
                <div className="pt-4 border-t border-gray-100 mt-2">
                  {!isStopped && !isHaltingMenuOpen && (
                    <button 
                      onClick={() => setHaltingPulseId(pulse.id)}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <StopCircle className="w-5 h-5 text-gray-500" />
                      Report Issue / Halt Machine
                    </button>
                  )}

                  {isStopped && (
                    <button 
                      onClick={() => handleResumeMachine(pulse.id)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Issue Resolved. Resume Machine
                    </button>
                  )}

                  {/* The "Tap to select reason" menu */}
                  {isHaltingMenuOpen && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="text-sm font-semibold text-gray-600 mb-1">Select Reason for Halt:</div>
                      {BLOCKER_REASONS.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => handleHaltMachine(pulse.id, reason)}
                          className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg border border-red-200 transition-colors"
                        >
                          {reason}
                        </button>
                      ))}
                      <button 
                        onClick={() => setHaltingPulseId(null)}
                        className="w-full mt-2 py-2 text-gray-500 font-medium hover:text-gray-700"
                      >
                        Cancel
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