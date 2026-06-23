"use client";

import { useEffect, useState } from "react";
import { PenTool, FileCheck, Clock, Layers, Maximize, AlertCircle, ArrowRight, Settings } from "lucide-react";

type Inquiry = {
  id: string;
  client_name: string;
  job_material: string;
  job_dimension: string;
  machine_type: string;
  status: string;
  created_at: string;
};

export default function EngineerDashboard() {
  const [designJobs, setDesignJobs] = useState<Inquiry[]>([]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/api/inquiries");
      if (res.ok) {
        const data = await res.json();
        setDesignJobs(data.filter((inq: Inquiry) => inq.status === "IN_DESIGN"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReleaseToFloor = async (id: string) => {
    setDesignJobs(prev => prev.filter(job => job.id !== id));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inquiries/${id}/release`, { method: "POST" });
      fetchJobs(); 
    } catch (err) {
      fetchJobs(); 
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-6">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-sm">
          <PenTool className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Design & Engineering Desk</h1>
          <p className="text-slate-500 font-medium mt-1">Pending Solidworks / AutoCAD Drawings required for the floor.</p>
        </div>
      </div>

      {designJobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-200 border-dashed">
          <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">Inbox Zero</h3>
          <p className="text-slate-500 mt-2">No active orders are waiting for design right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {designJobs.map((job) => {
            const daysOld = Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 3600 * 24));
            
            return (
              <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">{job.client_name}</h2>
                    <p className="text-slate-500 font-medium">Job ID: {job.id.split("-")[0].toUpperCase()}</p>
                  </div>
                  {daysOld > 2 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-red-50 text-red-700 border border-red-100">
                      <AlertCircle className="w-4 h-4" /> {daysOld} days in queue
                    </span>
                  )}
                </div>
                
                {/* Technical Specs Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><Layers className="w-4 h-4"/> Target Material</div>
                    <div className="font-semibold text-slate-800 text-lg">{job.job_material}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><Maximize className="w-4 h-4"/> Max Dimension</div>
                    <div className="font-semibold text-slate-800 text-lg">{job.job_dimension}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><Settings className="w-4 h-4"/> Automation Base</div>
                    <div className="font-semibold text-slate-800 text-lg">{job.machine_type.replace("_", " ")}</div>
                  </div>
                </div>

                {/* Handover Button */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleReleaseToFloor(job.id)}
                    className="px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 group"
                  >
                    Drawing Complete. Handover to Floor
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}