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
    const { financials, updateFinancials, employees, cashboxTransactions, addCashTransaction, addCustomExpense, deleteCustomExpense } = useFirmData();
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

    const totalMonthlyStaffHours = totalDailyStaffHours * 20;
    const hourlyOverhead = totalMonthlyStaffHours > 0 ? monthlyTotal / totalMonthlyStaffHours : monthlyTotal / 160;
    const totalHourlyBurn = totalHourlyStaffCost + hourlyOverhead;
    const dailyBurn = totalHourlyBurn * (totalDailyStaffHours || 8);

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
        addCustomExpense({
            id: Math.random().toString(36).substr(2, 9),
            name: newExpenseName,
            amount: Number(newExpenseAmount)
        });
        setNewExpenseName("");
        setNewExpenseAmount("");
    };

    // Calculate totals for modal
    const cashIn = cashboxTransactions.filter(tx => tx.type === "in" && tx.paymentMethod === "cash").reduce((acc, tx) => acc + tx.amount, 0);
    const checkIn = cashboxTransactions.filter(tx => tx.type === "in" && tx.paymentMethod === "check").reduce((acc, tx) => acc + tx.amount, 0);

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
                                <TableRow><TableCell className="font-medium">Total Staff Cost (Hourly)</TableCell><TableCell className="text-right">${totalHourlyStaffCost.toFixed(2)}</TableCell></TableRow>
                                <TableRow><TableCell className="font-medium">Fixed Overhead (Hourly)</TableCell><TableCell className="text-right">${Number(hourlyOverhead).toFixed(2)}</TableCell></TableRow>
                                <TableRow className="bg-destructive/10 hover:bg-destructive/20 font-bold"><TableCell>Total Hourly Burn</TableCell><TableCell className="text-right text-destructive">${totalHourlyBurn.toFixed(2)}</TableCell></TableRow>
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
