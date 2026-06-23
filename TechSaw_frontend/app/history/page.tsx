"use client";

import { useEffect, useState } from "react";
import { PackageCheck, CalendarDays } from "lucide-react";

type Inquiry = {
  id: string;
  client_name: string;
  job_material: string;
  job_dimension: string;
  machine_type: string;
  status: string;
  quoted_price: number | null;
  created_at: string;
};

export default function DispatchHistory() {
  const [archives, setArchives] = useState<Inquiry[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/api/inquiries");
        if (res.ok) {
          const data = await res.json();
          // Filter ONLY the finished jobs
          setArchives(data.filter((inq: Inquiry) => inq.status === "DISPATCHED"));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center gap-3 border-b border-slate-200 pb-6">
        <div className="p-3 bg-emerald-600 rounded-xl shadow-sm">
          <PackageCheck className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dispatch & Ledger History</h1>
          <p className="text-slate-500 font-medium mt-1">Permanent archive of all completed and dispatched orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="p-4">Date Logged</th>
              <th className="p-4">Client</th>
              <th className="p-4">Technical Specs</th>
              <th className="p-4">Revenue</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {archives.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No records found. Complete a job on the floor to see it here.</td>
              </tr>
            ) : (
              archives.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-500 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold text-slate-900">{job.client_name}</td>
                  <td className="p-4 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{job.machine_type.replace("_", " ")}</span>
                    <br />{job.job_dimension} · {job.job_material}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">
                    {job.quoted_price ? `₹${job.quoted_price.toLocaleString("en-IN")}` : "N/A"}
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Dispatched
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}