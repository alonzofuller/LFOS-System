"use client";

import { useFirmData } from "@/context/FirmContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, X, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const WITHDRAWAL_CATEGORIES = [
    "Supplies", "Stamps", "CNB Bank", "Bonus Pay", "Borrow", "Barter", "Lunch/Snacks", "Office Repairs", "Other"
] as const;

const DEPOSIT_CATEGORIES = [
    "Initial", "Client Payment", "Other"
] as const;

export default function FinancePage() {
    const {
        financials,
        updateFinancials,
        employees,
        cashboxTransactions,
        addCashTransaction,
        addCustomExpense,
        deleteCustomExpense,
        dailyBurnMetrics,
        incomeEntries,
        addIncomeEntry,
        deleteIncomeEntry,
        taskLogs
    } = useFirmData();
    const [editing, setEditing] = useState(false);
    const [showCashboxModal, setShowCashboxModal] = useState(false);
    const [newExpenseName, setNewExpenseName] = useState("");
    const [newExpenseAmount, setNewExpenseAmount] = useState("");

    const [formData, setFormData] = useState({
        monthlyLease: financials.monthlyLease || 0,
        payroll: financials.payroll || 0,
        clio: financials.clio || 0,
        phone: financials.phone || 0,
        wifi: financials.wifi || 0,
        printer: financials.printer || 0,
        postage: financials.postage || 0,
        efile: financials.efile || 0,
        supplies: financials.supplies || 0,
        chargebacks: financials.chargebacks || 0,
        staffLunch: financials.staffLunch || 0,
        otherMonthlyExpenses: financials.otherMonthlyExpenses || 0,
        cashOnHand: financials.cashOnHand,
        debt: financials.debt
    });

    const [cashTransaction, setCashTransaction] = useState({
        amount: "",
        description: "",
        paymentMethod: "cash" as "cash" | "check",
        category: "Client Payment" as typeof DEPOSIT_CATEGORIES[number] | typeof WITHDRAWAL_CATEGORIES[number],
        senderOrRecipient: "",
        type: "in" as "in" | "out"
    });

    // Calculate total daily staff hours
    const totalDailyStaffHours = employees.reduce((acc, emp) => acc + (emp.dailyHours || 8), 0);
    const totalHourlyStaffCost = employees.reduce((acc, emp) => acc + emp.hourlyCost, 0);

    // Custom expenses total
    const customExpenseTotal = (financials.customExpenses || []).reduce((acc, exp) => acc + exp.amount, 0);

    const monthlyTotal =
        Number(formData.monthlyLease) +
        Number(formData.payroll) +
        Number(formData.clio) +
        Number(formData.phone) +
        Number(formData.wifi) +
        Number(formData.printer) +
        Number(formData.postage) +
        Number(formData.efile) +
        Number(formData.supplies) +
        Number(formData.chargebacks) +
        Number(formData.staffLunch) +
        Number(formData.otherMonthlyExpenses) +
        customExpenseTotal;

    const { total_daily_burn, hourly_burn_rate } = dailyBurnMetrics;
    const dailyBurn = total_daily_burn;
    const totalHourlyBurn = hourly_burn_rate || 0;

    const handleSave = () => {
        updateFinancials({
            monthlyLease: Number(formData.monthlyLease),
            payroll: Number(formData.payroll),
            clio: Number(formData.clio),
            phone: Number(formData.phone),
            wifi: Number(formData.wifi),
            printer: Number(formData.printer),
            postage: Number(formData.postage),
            efile: Number(formData.efile),
            supplies: Number(formData.supplies),
            chargebacks: Number(formData.chargebacks),
            staffLunch: Number(formData.staffLunch),
            otherMonthlyExpenses: Number(formData.otherMonthlyExpenses),
            cashOnHand: Number(formData.cashOnHand),
            debt: Number(formData.debt)
        });
        setEditing(false);
    };

    const handleAddCashTransaction = () => {
        if (!cashTransaction.amount || !cashTransaction.description) {
            alert("Please enter amount and description.");
            return;
        }
        addCashTransaction({
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            type: cashTransaction.type,
            paymentMethod: cashTransaction.paymentMethod,
            category: cashTransaction.category,
            amount: Number(cashTransaction.amount),
            description: cashTransaction.description,
            senderOrRecipient: cashTransaction.senderOrRecipient,
            performedBy: "Admin"
        });
        setCashTransaction({
            amount: "",
            description: "",
            paymentMethod: "cash",
            category: "Client Payment",
            senderOrRecipient: "",
            type: "in"
        });
        alert("Transaction recorded successfully.");
    };

    const handleAddCustomExpense = () => {
        if (!newExpenseName || !newExpenseAmount) {
            alert("Please enter expense name and amount.");
            return;
        }

        const nameLower = newExpenseName.toLowerCase().trim();
        const expenseAmount = Number(newExpenseAmount);

        // Standard Expense Routing Map
        const standardExpenses: Record<string, keyof typeof financials> = {
            "lease": "monthlyLease",
            "rent": "monthlyLease",
            "office lease": "monthlyLease",
            "payroll": "payroll",
            "staff": "payroll",
            "labor": "payroll",
            "clio": "clio",
            "case management": "clio",
            "phone": "phone",
            "phones": "phone",
            "wifi": "wifi",
            "internet": "wifi",
            "frontier": "wifi",
            "printer": "printer",
            "printing": "printer",
            "kirbo": "printer",
            "postage": "postage",
            "stamps": "postage",
            "mail": "postage",
            "efile": "efile",
            "filing fees": "efile",
            "supplies": "supplies",
            "office supplies": "supplies",
            "chargebacks": "chargebacks",
            "lunch": "staffLunch",
            "staff lunch": "staffLunch",
            "meals": "staffLunch"
        };

        if (standardExpenses[nameLower]) {
            const keys = standardExpenses[nameLower];
            alert(`Smart Routing: Updating '${keys}' with $${expenseAmount} instead of creating duplicate.`);
            updateFinancials({ [keys]: expenseAmount });
        } else {
            addCustomExpense({
                id: Math.random().toString(36).substr(2, 9),
                name: newExpenseName,
                amount: expenseAmount
            });
        }

        setNewExpenseName("");
        setNewExpenseAmount("");
    };

    // Calculate totals for modal
    const cashIn = cashboxTransactions.filter(tx => tx.type === "in" && tx.paymentMethod === "cash").reduce((acc, tx) => acc + tx.amount, 0);
    const checkIn = cashboxTransactions.filter(tx => tx.type === "in" && tx.paymentMethod === "check").reduce((acc, tx) => acc + tx.amount, 0);

    // === WEEKLY FINANCIAL LOGIC (Wed-Tue) ===
    const getFiscalWeekRange = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed, ..., 6=Sat

        // Calculate days since last Wednesday
        // If today is Wednesday (3), days since is 0.
        // If today is Tuesday (2), days since is 6.
        let daysSinceWed = currentDay - 3;
        if (daysSinceWed < 0) daysSinceWed += 7;

        const start = new Date(today);
        start.setDate(today.getDate() - daysSinceWed);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    const { start: weekStart, end: weekEnd } = getFiscalWeekRange();

    // Filter Income
    const weeklyIncome = (incomeEntries || []).filter(entry => {
        const d = new Date(entry.date);
        return d >= weekStart && d <= weekEnd;
    });
    const totalWeeklyIncome = weeklyIncome.reduce((acc, entry) => acc + Number(entry.amount), 0);

    // Filter Labor (Task Logs)
    const weeklyLabor = taskLogs.filter(log => {
        const d = new Date(log.date); // Log date is YYYY-MM-DD
        // Create date object in local time to match range
        const logDate = new Date(log.date + "T12:00:00");
        return logDate >= weekStart && logDate <= weekEnd;
    });
    const totalWeeklyLaborCost = weeklyLabor.reduce((acc, log) => acc + (log.laborCost || 0), 0);
    const totalWeeklyProductionCost = weeklyLabor.reduce((acc, log) => acc + (log.productionCost || 0), 0);

    // Calculate Fixed Overhead for period (7 days)
    // Using simple 7 * daily_fixed_overhead from context
    const weeklyFixedOverhead = dailyBurnMetrics.daily_fixed_overhead * 7;
    const totalWeeklyExpenses = totalWeeklyLaborCost + weeklyFixedOverhead;

    const weeklyNetProfit = totalWeeklyIncome - totalWeeklyExpenses;

    // State for new income entry
    const [newIncome, setNewIncome] = useState({
        amount: "",
        clientName: "",
        description: "",
        category: "Retainer",
        method: "Check",
        date: new Date().toISOString().split('T')[0]
    });

    const handleAddIncome = () => {
        if (!newIncome.amount || !newIncome.clientName) {
            alert("Please entering amount and client name.");
            return;
        }
        addIncomeEntry({
            id: Math.random().toString(36).substr(2, 9),
            ...newIncome,
            amount: Number(newIncome.amount),
            date: newIncome.date,
            method: newIncome.method as any,
            category: newIncome.category as any
        });
        setNewIncome({ ...newIncome, amount: "", clientName: "", description: "" });
    };

    return (
        <div className="min-h-screen p-8 md:p-12 space-y-8 bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900">
            <header className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Financial Intelligence</h1>
                    <p className="text-white/70 mt-2">Know your numbers. Stop the bleeding.</p>
                </div>
                <Button variant={editing ? "default" : "outline"} onClick={() => editing ? handleSave() : setEditing(true)}>
                    {editing ? "Save Changes" : "Edit Financials"}
                </Button>
            </header>

            <div className="grid gap-6">
                {/* WEEKLY PROFIT & LOSS ENGINE */}
                <Card className="bg-slate-950 border-emerald-500/30 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl text-white">Weekly Situational Analysis</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Fiscal Week: {weekStart.toLocaleDateString()} — {weekEnd.toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Net Profit</div>
                                <div className={`text-4xl font-bold tracking-tighter ${weeklyNetProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {weeklyNetProfit >= 0 ? "+" : ""}${weeklyNetProfit.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        {/* INCOME COLUMN */}
                        <div className="space-y-4">
                            <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 p-4">
                                <div className="text-sm text-emerald-400 font-medium uppercase mb-1">Total Income</div>
                                <div className="text-3xl font-bold text-white">${totalWeeklyIncome.toLocaleString()}</div>
                                <div className="text-xs text-slate-500 mt-2">Deposits & Payments</div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase text-slate-500">Record New Income</h4>
                                <Input
                                    placeholder="Amount ($)"
                                    type="number"
                                    value={newIncome.amount}
                                    onChange={e => setNewIncome({ ...newIncome, amount: e.target.value })}
                                    className="!bg-slate-900 !border-slate-700 !text-white !placeholder:text-slate-500"
                                />
                                <Input
                                    placeholder="Client Name"
                                    value={newIncome.clientName}
                                    onChange={e => setNewIncome({ ...newIncome, clientName: e.target.value })}
                                    className="!bg-slate-900 !border-slate-700 !text-white !placeholder:text-slate-500"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        className="h-9 rounded-md border !border-slate-700 !bg-slate-900 px-3 text-sm !text-white"
                                        value={newIncome.category}
                                        onChange={e => setNewIncome({ ...newIncome, category: e.target.value })}
                                    >
                                        <option>Retainer</option>
                                        <option>Monthly Fee</option>
                                        <option>Flat Fee</option>
                                        <option>Consultation</option>
                                        <option>Other</option>
                                    </select>
                                    <select
                                        className="h-9 rounded-md border !border-slate-700 !bg-slate-900 px-3 text-sm !text-white"
                                        value={newIncome.method}
                                        onChange={e => setNewIncome({ ...newIncome, method: e.target.value })}
                                    >
                                        <option>Check</option>
                                        <option>Cash</option>
                                        <option>Credit Card</option>
                                        <option>Zelle</option>
                                        <option>Wire</option>
                                    </select>
                                </div>
                                <Input
                                    placeholder="Description (Optional)"
                                    value={newIncome.description}
                                    onChange={e => setNewIncome({ ...newIncome, description: e.target.value })}
                                    className="!bg-slate-900 !border-slate-700 text-xs !text-white !placeholder:text-slate-500"
                                />
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddIncome}>
                                    Add Income
                                </Button>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                                {weeklyIncome.map(inc => (
                                    <div key={inc.id} className="text-xs flex justify-between items-center p-2 rounded bg-slate-800/50 border border-slate-700/50 group">
                                        <div>
                                            <div className="font-medium text-slate-200">{inc.clientName}</div>
                                            <div className="text-slate-500">{inc.method} • {new Date(inc.date).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-emerald-400">+${inc.amount}</div>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Delete this income entry?")) deleteIncomeEntry(inc.id)
                                                }}
                                                className="text-slate-500 hover:text-red-500 transition-colors ml-2"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* EXPENSE COLUMN */}
                        <div className="space-y-4">
                            <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-4">
                                <div className="text-sm text-red-400 font-medium uppercase mb-1">Total Expenses</div>
                                <div className="text-3xl font-bold text-white">${totalWeeklyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                <div className="text-xs text-slate-500 mt-2">Labor + Fixed Overhead</div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm p-2 bg-slate-800/50 rounded">
                                    <span className="text-slate-400">Labor Cost (Actual)</span>
                                    <span className="font-medium text-white">${totalWeeklyLaborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between text-sm p-2 bg-slate-800/50 rounded">
                                    <span className="text-slate-400">Fixed Overhead (7 Days)</span>
                                    <span className="font-medium text-white">${weeklyFixedOverhead.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Cost Drivers (By Employee)</h4>
                                    {employees.map(emp => {
                                        const empLabor = weeklyLabor.filter(l => l.employeeId === emp.id).reduce((sum, l) => sum + l.laborCost, 0);
                                        if (empLabor === 0) return null;
                                        return (
                                            <div key={emp.id} className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">{emp.name}</span>
                                                <span className="text-red-300">-${empLabor.toFixed(0)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* INSIGHTS COLUMN */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold uppercase text-slate-500">Intelligence Report</h4>
                            <div className={`p-4 rounded border text-sm ${weeklyNetProfit > 0 ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-200" : "bg-red-950/10 border-red-500/20 text-red-200"}`}>
                                {weeklyNetProfit > 0
                                    ? "Firm is PROFITABLE this week. Revenue exceeds operating costs. Consider reinvesting in case acquisition."
                                    : "Firm is operating at a LOSS this week. Immediate attention required: Increase intake or reduce non-essential labor."
                                }
                            </div>

                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-semibold uppercase text-slate-500">Efficiency Ratio</h4>
                                <div className="text-xs text-slate-400">
                                    For every $1.00 spent on labor/overhead, the firm generated:
                                </div>
                                <div className={`text-2xl font-bold ${totalWeeklyIncome / (totalWeeklyExpenses || 1) > 1 ? "text-emerald-400" : "text-amber-400"}`}>
                                    ${(totalWeeklyIncome / (totalWeeklyExpenses || 1)).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-2 bg-card/80 backdrop-blur-sm border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {editing ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Monthly Lease</label>
                                    <Input type="number" value={formData.monthlyLease} onChange={(e) => setFormData({ ...formData, monthlyLease: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Payroll</label>
                                    <Input type="number" value={formData.payroll} onChange={(e) => setFormData({ ...formData, payroll: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Clio Case Mgmt</label>
                                    <Input type="number" value={formData.clio} onChange={(e) => setFormData({ ...formData, clio: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Phone</label>
                                    <Input type="number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Frontier Wi-Fi</label>
                                    <Input type="number" value={formData.wifi} onChange={(e) => setFormData({ ...formData, wifi: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Kirbo Printer</label>
                                    <Input type="number" value={formData.printer} onChange={(e) => setFormData({ ...formData, printer: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Postage</label>
                                    <Input type="number" value={formData.postage} onChange={(e) => setFormData({ ...formData, postage: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">eFile Fees</label>
                                    <Input type="number" value={formData.efile} onChange={(e) => setFormData({ ...formData, efile: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Supplies</label>
                                    <Input type="number" value={formData.supplies} onChange={(e) => setFormData({ ...formData, supplies: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Chargebacks</label>
                                    <Input type="number" value={formData.chargebacks} onChange={(e) => setFormData({ ...formData, chargebacks: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Staff Lunch</label>
                                    <Input type="number" value={formData.staffLunch} onChange={(e) => setFormData({ ...formData, staffLunch: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Other</label>
                                    <Input type="number" value={formData.otherMonthlyExpenses} onChange={(e) => setFormData({ ...formData, otherMonthlyExpenses: Number(e.target.value) })} />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Lease</span><span>${financials.monthlyLease}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Payroll</span><span>${financials.payroll || 0}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Clio</span><span>${financials.clio || 0}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Phone</span><span>${financials.phone || 0}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Wi-Fi</span><span>${financials.wifi || 0}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Printer</span><span>${financials.printer || 0}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Postage</span><span>${financials.postage}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">eFile</span><span>${financials.efile}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Supplies</span><span>${financials.supplies}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Chargebacks</span><span>${financials.chargebacks}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Staff Lunch</span><span>${financials.staffLunch}</span></div>
                                <div className="flex justify-between border-b border-dashed pb-1"><span className="text-muted-foreground">Other</span><span>${financials.otherMonthlyExpenses}</span></div>
                                {(financials.customExpenses || []).map(exp => (
                                    <div key={exp.id} className="flex justify-between border-b border-dashed pb-1 col-span-1">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            {exp.name}
                                            <button onClick={() => deleteCustomExpense(exp.id)} className="text-red-500 hover:text-red-400">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </span>
                                        <span>${exp.amount}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between border-b border-dashed pb-1 col-span-3 mt-2 font-medium text-primary">
                                    <span>Total Fixed Overhead</span>
                                    <span>${monthlyTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Add Custom Expense */}
                        <div className="mt-4 p-3 border border-dashed border-white/20 rounded-lg">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-muted-foreground">Expense Name</label>
                                    <Input placeholder="Insurance, Advertising..." value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} />
                                </div>
                                <div className="w-24 space-y-1">
                                    <label className="text-xs text-muted-foreground">Amount</label>
                                    <Input type="number" placeholder="100" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} />
                                </div>
                                <Button onClick={handleAddCustomExpense} size="icon" variant="outline">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {editing ? (
                            <Input type="number" value={formData.debt} onChange={(e) => setFormData({ ...formData, debt: Number(e.target.value) })} />
                        ) : (
                            <div className="text-2xl font-bold text-destructive">${financials.debt.toLocaleString()}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Outstanding Liabilities</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle>Operating Cost Breakdown</CardTitle>
                        <CardDescription>Based on {totalDailyStaffHours || 8} total staff hours/day.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow><TableCell className="font-medium">Total Staff Payroll (Daily)</TableCell><TableCell className="text-right">${dailyBurnMetrics.daily_payroll.toFixed(2)}</TableCell></TableRow>
                                <TableRow><TableCell className="font-medium">Fixed Overhead (Daily)</TableCell><TableCell className="text-right">${dailyBurnMetrics.daily_fixed_overhead.toFixed(2)}</TableCell></TableRow>
                                <TableRow className="bg-destructive/10 hover:bg-destructive/20 font-bold"><TableCell>Total Daily Burn</TableCell><TableCell className="text-right text-destructive">${total_daily_burn.toFixed(2)}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Daily Burn ({totalDailyStaffHours}h)</span><span className="font-medium">${dailyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Weekly Burn (5d)</span><span className="font-medium">${(dailyBurn * 5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Yearly Burn (260d)</span><span className="font-medium">${(dailyBurn * 260).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Survival Calculator</CardTitle>
                        <CardDescription>Time until insolvency at current burn rate.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-yellow-950/30 flex items-center justify-center text-yellow-500">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-5xl font-bold tracking-tighter">{dailyBurn > 0 ? Math.floor(formData.cashOnHand / dailyBurn) : "∞"}</div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2">Days Remaining</p>
                        </div>
                        <p className="text-sm text-yellow-600/80 max-w-xs">Note: This assumes $0 revenue. Every dollar you make extends this timeline.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Cashbox Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-amber-900/20 to-amber-950/10 backdrop-blur-sm border-amber-500/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-xl">💰</span> Cashbox Management
                        </CardTitle>
                        <CardDescription>
                            Petty cash tracking. Current Balance: <span className="font-bold text-foreground">${financials.cashboxBalance}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Type</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={cashTransaction.type}
                                    onChange={(e) => setCashTransaction({ ...cashTransaction, type: e.target.value as "in" | "out", category: e.target.value === "in" ? "Client Payment" : "Supplies" })}
                                >
                                    <option value="in">Deposit (+)</option>
                                    <option value="out">Withdrawal (-)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Payment Method</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={cashTransaction.paymentMethod}
                                    onChange={(e) => setCashTransaction({ ...cashTransaction, paymentMethod: e.target.value as "cash" | "check" })}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="check">Check</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Category</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={cashTransaction.category}
                                onChange={(e) => setCashTransaction({ ...cashTransaction, category: e.target.value as any })}
                            >
                                {cashTransaction.type === "in"
                                    ? DEPOSIT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                                    : WITHDRAWAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                                }
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Amount" type="number" value={cashTransaction.amount} onChange={(e) => setCashTransaction({ ...cashTransaction, amount: e.target.value })} />
                            <Input placeholder="From/To (Person)" value={cashTransaction.senderOrRecipient} onChange={(e) => setCashTransaction({ ...cashTransaction, senderOrRecipient: e.target.value })} />
                        </div>
                        <Input placeholder="Description/Notes" value={cashTransaction.description} onChange={(e) => setCashTransaction({ ...cashTransaction, description: e.target.value })} />
                        <Button className="w-full" onClick={handleAddCashTransaction}>
                            {cashTransaction.type === "in" ? "Add Deposit" : "Record Withdrawal"}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Cashbox History</CardTitle>
                            <Button variant="outline" size="sm" onClick={() => setShowCashboxModal(true)}>View All</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Desc</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashboxTransactions.slice(0, 5).map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium text-xs truncate max-w-[100px]">{tx.description}</TableCell>
                                        <TableCell>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${tx.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {tx.paymentMethod} {tx.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">${tx.amount}</TableCell>
                                    </TableRow>
                                ))}
                                {cashboxTransactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground text-xs h-12">
                                            No transactions yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Cashbox Modal */}
            {showCashboxModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b bg-muted/20">
                            <div>
                                <h2 className="text-2xl font-bold">Cashbox Ledger</h2>
                                <p className="text-muted-foreground text-sm">Complete transaction history</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowCashboxModal(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6 grid grid-cols-3 gap-4 border-b bg-muted/10">
                            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                <div className="text-2xl font-bold text-green-500">${cashIn.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Cash In</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                <div className="text-2xl font-bold text-blue-500">${checkIn.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Checks In</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30">
                                <div className="text-2xl font-bold text-primary">${financials.cashboxBalance.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Balance</div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>From/To</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashboxTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="text-xs">{new Date(tx.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${tx.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {tx.paymentMethod} {tx.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">{tx.category}</TableCell>
                                            <TableCell className="text-xs">{tx.description}</TableCell>
                                            <TableCell className="text-xs">{tx.senderOrRecipient || "-"}</TableCell>
                                            <TableCell className={`text-right font-mono font-bold ${tx.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.type === 'in' ? '+' : '-'}${tx.amount}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {cashboxTransactions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                                No transactions recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
