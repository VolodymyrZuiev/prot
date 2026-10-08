import { useMemo, useState } from "react";
import { recommendRate } from "../data";
import { useStore } from "../store";

export function PricingPopover() {
  const { setPricingOpen, applyRate, modalQuote, workspaceQuote } = useStore();
  const [miles, setMiles] = useState(modalQuote?.form.miles || workspaceQuote?.form.miles || "700");
  const [weight, setWeight] = useState(modalQuote?.form.weight || workspaceQuote?.form.weight || "380");
  const [equipment, setEquipment] = useState(modalQuote?.equipment || workspaceQuote?.equipment || "Van");
  const rate = useMemo(() => recommendRate(miles, weight, equipment), [miles, weight, equipment]);

  return (
    <>
      <button type="button" aria-label="Close pricing" className="fixed inset-0 z-30 cursor-default" onClick={() => setPricingOpen(false)} />
      <div className="absolute left-0 top-10 z-40 w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="text-sm font-semibold">Rate desk</div>
        <p className="mt-0.5 text-[12px] text-slate-500">Expedite van, sprinter, or OTR linehaul.</p>
        <label className="mt-3 block text-[12px] text-slate-500">
          Equipment
          <select
            value={equipment}
            onChange={(event) => setEquipment(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-[13px] text-slate-800"
          >
            <option>Van</option>
            <option>Sprinter</option>
            <option>OTR</option>
          </select>
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-[12px] text-slate-500">
            Miles
            <input value={miles} onChange={(event) => setMiles(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-[13px]" />
          </label>
          <label className="text-[12px] text-slate-500">
            Weight
            <input value={weight} onChange={(event) => setWeight(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-[13px]" />
          </label>
        </div>
        <div className="mt-3 rounded-xl bg-[#eef4ff] px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Recommended</div>
          <div className="text-xl font-semibold text-[#1d4fd0]">${rate.toLocaleString("en-US")}</div>
        </div>
        <button
          type="button"
          onClick={() => applyRate(`$${rate.toLocaleString("en-US")}`)}
          className="mt-3 h-9 w-full rounded-full bg-[#2f6cf6] text-[13px] font-semibold text-white"
        >
          Use this rate
        </button>
      </div>
    </>
  );
}
