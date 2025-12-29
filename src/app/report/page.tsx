"use client";

import { useFirmData } from "@/context/FirmContext";
import { Button } from "@/components/ui/button";
import { Printer, Scale, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ReportPage() {
    const { clients, employees, taskLogs, financials } = useFirmData();

    // --- Time Calculations ---
    const getStartOfWeek = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };
    const startOfWeek = getStartOfWeek();
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    // --- Financial Calculations ---
    // Note: In the new model, we track Labor Cost and Production Cost, not direct revenue per task
    // For reporting, we sum Production Cost as the "cost" side
    const weeklyProductionCost = taskLogs
        .filter(log => log.date >= startOfWeekStr)
        .reduce((acc, log) => acc + (log.productionCost || 0), 0);

    const weeklyLaborCost = employees.reduce((acc, emp) => {
        const empLogs = taskLogs.filter(log => log.employeeId === emp.id && log.date >= startOfWeekStr);
        const hours = empLogs.reduce((h, log) => h + log.hours, 0);
        return acc + (hours * emp.hourlyCost);
    }, 0);

    const weeklyFixedOverhead = (
        (Number(financials.monthlyLease) || 0) +
        (Number(financials.otherMonthlyExpenses) || 0) +
        (Number(financials.postage) || 0) +
        (Number(financials.efile) || 0) +
        (Number(financials.supplies) || 0) +
        (Number(financials.chargebacks) || 0) +
        (Number(financials.staffLunch) || 0)
    ) / 4;

    const weeklyTotalBurn = weeklyLaborCost + weeklyFixedOverhead;
    const weeklyNet = 0 - weeklyProductionCost; // Production cost represents work done at cost

    // --- Client Metrics ---
    const newClients = clients.filter(c => c.lastCommunication >= startOfWeekStr && c.status === 'active').length;
    const churnedClients = clients.filter(c => c.status === 'churned').length; // Total churned, could refine to weekly if dates tracked
    const atRiskClients = clients.filter(c => c.status === 'risk');

    return (
        <div className="min-h-screen p-8 print:p-0 print:bg-white bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900">
            {/* Control Bar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Weekly SitRep</h1>
                    <p className="text-white/70">Digital View</p>
                </div>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="w-4 h-4" /> Print Formal Brief
                </Button>
            </div>

            {/* Document Sheet */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-12 md:p-16 border print:border-none min-h-[1100px] text-zinc-900">

                {/* Formal Header */}
                <header className="border-b-2 border-zinc-900 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Scale className="w-6 h-6 text-zinc-900" />
                            <span className="font-serif font-bold text-lg tracking-wider uppercase">iTeam Legal Solutions</span>
                        </div>
                        <h1 className="font-serif text-4xl font-bold text-zinc-900 mt-2">Situation Report</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-widest">
                            Confidential // Internal Use Only
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-zinc-900">WEEK OF</div>
                        <div className="font-serif text-xl">
                            {startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Executive Summary */}
                <section className="mb-10">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b pb-1">I. Executive Summary</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-4 border-l-4 border-zinc-900 bg-zinc-50">
                            <div className="text-sm font-medium text-zinc-500 uppercase">Net Profit/Loss</div>
                            <div className={`text-3xl font-serif font-bold mt-1 ${weeklyNet >= 0 ? 'text-zinc-900' : 'text-red-700'}`}>
                                {weeklyNet >= 0 ? '+' : ''}${weeklyNet.toLocaleString()}
                            </div>
                            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                {weeklyNet >= 0
                                    ? "Firm is operating profitably this week. Surplus capital should be allocated to debt reduction or cash reserves."
                                    : "Firm is operating at a deficit. Immediate review of labor efficiency and expense control is required to prevent insolvency."
                                }
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-bold text-zinc-500">Labor Cost</div>
                                <div className="text-xl font-medium">${weeklyLaborCost.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-500">Expenses</div>
                                <div className="text-xl font-medium text-red-600">${weeklyTotalBurn.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-500">Cash Runway</div>
                                <div className="text-xl font-medium">{Math.floor(financials.cashOnHand / (weeklyTotalBurn / 5))} Days</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-500">Active Matters</div>
                                <div className="text-xl font-medium">{clients.length}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Staff Efficiency (The Meat) */}
                <section className="mb-10">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b pb-1">II. Personnel Efficiency Audit</h2>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 font-bold text-zinc-700 uppercase">
                            <tr>
                                <th className="p-2 pl-4">Staff Member</th>
                                <th className="p-2 text-right">Hours Logged</th>
                                <th className="p-2 text-right">Labor Cost</th>
                                <th className="p-2 text-right">Revenue Generated</th>
                                <th className="p-2 pr-4 text-right">ROI Multiplier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {employees.map(emp => {
                                const empLogs = taskLogs.filter(log => log.employeeId === emp.id && log.date >= startOfWeekStr);
                                const hours = empLogs.reduce((acc, log) => acc + log.hours, 0);
                                const laborCost = empLogs.reduce((acc, log) => acc + (log.laborCost || 0), 0);
                                const productionCost = empLogs.reduce((acc, log) => acc + (log.productionCost || 0), 0);
                                const efficiency = laborCost > 0 ? (productionCost / laborCost).toFixed(2) : "1.00";
                                const isProfitable = Number(efficiency) >= 1;

                                return (
                                    <tr key={emp.id} className="group">
                                        <td className="p-2 pl-4 font-medium">{emp.name}</td>
                                        <td className="p-2 text-right text-zinc-500">{hours.toFixed(1)}h</td>
                                        <td className="p-2 text-right text-zinc-500">${laborCost.toLocaleString()}</td>
                                        <td className="p-2 text-right text-zinc-900 font-medium">${productionCost.toLocaleString()}</td>
                                        <td className="p-2 pr-4 text-right">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isProfitable ? 'bg-zinc-100 text-zinc-900 border border-zinc-300' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                                {efficiency}x
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>

                {/* Risk Radar */}
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4 border-b pb-1">III. Risk & Opportunities</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-red-700">
                                <AlertTriangle className="w-4 h-4" /> At-Risk Clients (Last Contact &gt; 14 Days)
                            </h3>
                            {atRiskClients.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {atRiskClients.map(c => (
                                        <li key={c.id} className="flex justify-between items-center p-2 bg-red-50 border border-red-100 rounded">
                                            <span>{c.name}</span>
                                            <span className="text-xs text-red-500 font-medium">Overdue Update</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-sm text-zinc-400 italic">No clients currently at risk. Good communications discipline.</div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="w-4 h-4" /> Operational Notes
                            </h3>
                            <ul className="list-disc list-inside text-sm text-zinc-600 space-y-1">
                                <li>Weekly Burn Rate: <strong>${weeklyTotalBurn.toLocaleString()}</strong></li>
                                <li>Cashbox Balance: <strong>${financials.cashboxBalance}</strong></li>
                                <li>New Cases This Week: <strong>{newClients}</strong></li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-400">
                    <div>Generated by Law Firm Survival & Recovery System (LFOS)</div>
                    <div>Page 1 of 1</div>
                </footer>

            </div>
        </div>
    );
}
