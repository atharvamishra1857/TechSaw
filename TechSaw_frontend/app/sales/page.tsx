"use client";

import { useEffect, useState } from "react";
import { Settings, ArrowRight, CheckCircle2, Plus, X } from "lucide-react";

type Inquiry = {
  id: string;
  client_name: string;
  phone_number: string | null;
  job_material: string;
  job_dimension: string;
  machine_type: string;
  status: string;
  quoted_price: number | null;
  created_at: string;
};

export default function SalesCRM() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "", phone_number: "", job_material: "", job_dimension: "", machine_type: "SEMI_AUTOMATIC"
  });

  const fetchInquiries = async () => {
    try {
      const res = await fetch("${process.env.NEXT_PUBLIC_API_URL}/api/inquiries");
      if (res.ok) setInquiries(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 5000);
    return () => clearInterval(interval);
  }, []);

  // API Call: Create Manual Lead (IndiaMart / Phone)
  const handleManualLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("${process.env.NEXT_PUBLIC_API_URL}/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, quantity: 1 }),
      });
      setIsModalOpen(false);
      setFormData({ client_name: "", phone_number: "", job_material: "", job_dimension: "", machine_type: "SEMI_AUTOMATIC" });
      fetchInquiries();
    } catch (err) {
      console.error("Failed to add lead", err);
    }
  };

  // API Call: Draft Quote
  const handleDraftQuote = async (id: string) => {
    const priceStr = window.prompt("Enter Quoted Price (₹):");
    if (!priceStr || isNaN(Number(priceStr))) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inquiries/${id}/quote?price=${Number(priceStr)}`, { method: "POST" });
      fetchInquiries();
    } catch (err) { console.error(err); }
  };

  // API Call: Confirm Order
  const handleConfirmOrder = async (id: string) => {
    setInquiries(prev => prev.filter(job => job.id !== id)); // Optimistic UI
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inquiries/${id}/confirm`, { method: "POST" });
      fetchInquiries();
    } catch (err) { fetchInquiries(); }
  };

  // API Call: Push to Engineer
  const pushToEngineer = async (id: string) => {
    setInquiries(prev => prev.filter(job => job.id !== id)); // Optimistic UI
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inquiries/${id}/push_to_design`, { method: "POST" });
      fetchInquiries(); 
    } catch (err) { fetchInquiries(); }
  };

  // The Column UI Builder
  const Column = ({ title, status, bgColor, borderColor }: any) => {
    const jobs = inquiries.filter((inq) => inq.status === status);
    
    return (
      <div className={`flex flex-col bg-slate-50 rounded-xl border ${borderColor} p-4 min-h-[70vh]`}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
          <h2 className="font-bold text-slate-700">{title}</h2>
          <span className={`${bgColor} text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full`}>{jobs.length}</span>
        </div>

        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-900 text-lg">{job.client_name}</h3>
                <span className="text-xs text-slate-400 font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 text-sm mb-3">
                <div className="font-semibold text-slate-800 flex justify-between items-center">
                  {job.machine_type.replace("_", " ")}
                  {job.quoted_price && <span className="text-emerald-600 font-bold">₹{job.quoted_price.toLocaleString("en-IN")}</span>}
                </div>
                <div className="text-slate-500 mt-1 flex items-center gap-1.5 text-xs">
                  <Settings className="w-3.5 h-3.5" /> 
                  {job.job_dimension} · {job.job_material}
                </div>
              </div>

              {/* Dynamic Buttons Based on State */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                {status === "NEW" && (
                  <button onClick={() => handleDraftQuote(job.id)} className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-sm transition-colors">
                    Draft Quote
                  </button>
                )}
                {status === "QUOTED" && (
                  <button onClick={() => handleConfirmOrder(job.id)} className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Client Accepted PO
                  </button>
                )}
                {status === "CONFIRMED" && (
                  <button onClick={() => pushToEngineer(job.id)} className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all">
                    Push to Engineer <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 relative">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales & PO Pipeline</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage web leads, IndiaMart inquiries, and phone calls.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Manual Lead Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column title="New Leads" status="NEW" bgColor="bg-blue-100" borderColor="border-blue-200" />
        <Column title="Quote Sent" status="QUOTED" bgColor="bg-amber-100" borderColor="border-amber-200" />
        <Column title="Confirmed POs" status="CONFIRMED" bgColor="bg-emerald-100" borderColor="border-emerald-200" />
      </div>

      {/* MANUAL LEAD ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Add Manual Lead</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleManualLeadSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client/Company Name</label>
                <input required type="text" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Material</label>
                  <input required type="text" placeholder="e.g. Mild Steel" value={formData.job_material} onChange={e => setFormData({...formData, job_material: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Dimension</label>
                  <input required type="text" placeholder="e.g. 250mm" value={formData.job_dimension} onChange={e => setFormData({...formData, job_dimension: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Machine Base</label>
                <select value={formData.machine_type} onChange={e => setFormData({...formData, machine_type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="MANUAL">Manual</option>
                  <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                  <option value="AUTOMATIC">Automatic</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg mt-2 transition-colors">
                Save & Add to Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}