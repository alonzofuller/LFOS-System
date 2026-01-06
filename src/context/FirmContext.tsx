"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Employee, TaskLog, FinancialData, Client, CashTransaction, CustomExpense, SupportTicket, CaseType } from "@/types";
import { db, isConfigured } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    getDocs
} from "firebase/firestore";

// Default Case Type Templates with Estimated Hours
const DEFAULT_CASE_TYPES: CaseType[] = [
    { id: "hc1107", name: "Habeas Corpus Art. 11.07", estimatedHours: 75 },
    { id: "sentred", name: "Sentence Reduction/Time Cut", estimatedHours: 25 },
    { id: "hc2254", name: "Habeas Corpus 2254", estimatedHours: 80 },
    { id: "parole", name: "Parole Packet", estimatedHours: 25 },
    { id: "appcrim", name: "Appeal - Criminal", estimatedHours: 40 },
    { id: "appciv", name: "Appeal - Civil", estimatedHours: 55 },
    { id: "civil", name: "Civil Lawsuit", estimatedHours: 105 },
    { id: "tdcj", name: "TDCJ Complaint", estimatedHours: 15 },
    { id: "misdpre", name: "Misdemeanor - Pretrial", estimatedHours: 20 },
    { id: "felpre", name: "Felony - PreTrial", estimatedHours: 50 },
];

interface FirmContextType {
    employees: Employee[];
    taskLogs: TaskLog[];
    financials: FinancialData;
    clients: Client[];
    addEmployee: (employee: Employee) => void;
    updateEmployee: (id: string, updates: Partial<Employee>) => void;
    addTaskLog: (log: TaskLog) => void;
    updateFinancials: (data: Partial<FinancialData>) => void;
    addClient: (client: Client) => void;
    updateClient: (id: string, updates: Partial<Client>) => void;
    cashboxTransactions: CashTransaction[];
    addCashTransaction: (transaction: CashTransaction) => void;
    addCustomExpense: (expense: CustomExpense) => void;
    deleteCustomExpense: (id: string) => void;
    // Ticket System
    tickets: SupportTicket[];
    addTicket: (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => void;
    resolveTicket: (id: string, resolution: string) => void;
    // Case Type Templates
    caseTypes: CaseType[];
    addCaseType: (caseType: Omit<CaseType, 'id'>) => void;
    updateCaseType: (id: string, updates: Partial<CaseType>) => void;
    deleteCaseType: (id: string) => void;
    // Burn Metrics
    dailyBurnMetrics: {
        total_daily_burn: number;
        daily_payroll: number;
        daily_fixed_overhead: number;
        total_daily_hours: number;
        hourly_burn_rate: number | null;
    };
    isCloudSyncActive: boolean;
    firebaseProjectId: string | null;
    refreshEmployees: () => Promise<void>;
}

const FirmContext = createContext<FirmContextType | undefined>(undefined);

const INITIAL_EMPLOYEES: Employee[] = [];

const INITIAL_FINANCIALS: FinancialData = {
    fixedOverheadHourly: 0,
    monthlyLease: 0,
    payroll: 0,
    clio: 0,
    phone: 0,
    wifi: 0,
    printer: 0,
    postage: 0,
    efile: 0,
    supplies: 0,
    chargebacks: 0,
    staffLunch: 0,
    otherMonthlyExpenses: 0,
    customExpenses: [],
    cashOnHand: 0,
    debt: 0,
    cashboxBalance: 0,
};

export function FirmProvider({ children }: { children: React.ReactNode }) {
    const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
    const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
    const [financials, setFinancials] = useState<FinancialData>(INITIAL_FINANCIALS);
    const [clients, setClients] = useState<Client[]>([]);
    const [cashboxTransactions, setCashboxTransactions] = useState<CashTransaction[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [caseTypes, setCaseTypes] = useState<CaseType[]>(DEFAULT_CASE_TYPES);

    // Calculate total employee work hours per day (for burn calculation)
    const totalDailyStaffHours = employees.reduce((acc, emp) => acc + (emp.dailyHours || 8), 0);

    // Calculate overhead dynamically during render (Derived State)
    const customExpenseTotal = (financials.customExpenses || []).reduce((acc, exp) => acc + exp.amount, 0);

    const monthlyTotal =
        (Number(financials.monthlyLease) || 0) +
        (Number(financials.payroll) || 0) +
        (Number(financials.clio) || 0) +
        (Number(financials.phone) || 0) +
        (Number(financials.wifi) || 0) +
        (Number(financials.printer) || 0) +
        (Number(financials.postage) || 0) +
        (Number(financials.efile) || 0) +
        (Number(financials.supplies) || 0) +
        (Number(financials.chargebacks) || 0) +
        (Number(financials.staffLunch) || 0) +
        (Number(financials.otherMonthlyExpenses) || 0) +
        customExpenseTotal;

    // Use actual total staff hours per month (sum of each employee's daily hours * 20 workdays)
    const totalMonthlyStaffHours = totalDailyStaffHours * 20;
    const hourlyOverhead = totalMonthlyStaffHours > 0 ? monthlyTotal / totalMonthlyStaffHours : monthlyTotal / 160;

    // MERGE: New Total Daily Burn Logic
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = taskLogs.filter(log => log.date === todayStr);

    const daily_payroll = todayLogs.reduce((acc, log) => acc + (log.laborCost || 0), 0);
    const total_daily_hours = todayLogs.reduce((acc, log) => acc + (log.hours || 0), 0);

    // Rule: Fixed overhead normalized to daily value (assuming 20 operating days)
    const operating_days_per_month = 20;
    const daily_fixed_overhead = monthlyTotal / operating_days_per_month;

    const total_daily_burn = daily_payroll + daily_fixed_overhead;
    const hourly_burn_rate = total_daily_hours > 0 ? total_daily_burn / total_daily_hours : null;

    const dailyBurnMetrics = {
        total_daily_burn,
        daily_payroll,
        daily_fixed_overhead,
        total_daily_hours,
        hourly_burn_rate
    };

    // Merge calculated overhead into the financials object exposed to context
    const exposedFinancials = {
        ...financials,
        fixedOverheadHourly: hourlyOverhead
    };

    // 1. Load from local storage ONCE as a baseline/offline cache
    useEffect(() => {
        const storedData = localStorage.getItem("law-firm-os-data");
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                if (parsed.employees) setEmployees(parsed.employees);
                if (parsed.taskLogs) setTaskLogs(parsed.taskLogs);
                if (parsed.financials) setFinancials({ ...INITIAL_FINANCIALS, ...parsed.financials });
                if (parsed.clients) setClients(parsed.clients);
                if (parsed.cashboxTransactions) setCashboxTransactions(parsed.cashboxTransactions);
                if (parsed.tickets) setTickets(parsed.tickets);
                if (parsed.caseTypes) {
                    const storedIds = new Set(parsed.caseTypes.map((ct: CaseType) => ct.id));
                    const newDefaults = DEFAULT_CASE_TYPES.filter(d => !storedIds.has(d.id));
                    setCaseTypes([...parsed.caseTypes, ...newDefaults]);
                }
            } catch (e) {
                console.error("Failed to load local data", e);
            }
        }
    }, []);

    // 2. Setup Real-time Listeners if Firebase is configured
    useEffect(() => {
        if (!isConfigured) return;

        console.log("Firebase Backend detected. Initializing real-time listeners...");

        const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    ...docData,
                    id: doc.id // Force the document ID to be the object ID
                };
            }) as Employee[];
            console.log(`[Sync] Received ${data.length} employees from cloud.`);
            setEmployees(data);
        }, (err) => console.error("Employees Stream Error:", err));

        const unsubTaskLogs = onSnapshot(collection(db, "taskLogs"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as TaskLog[];
            setTaskLogs(data);
        }, (err) => console.error("TaskLogs Stream Error:", err));

        const unsubFinancials = onSnapshot(doc(db, "settings", "financials"), (docSnap) => {
            if (docSnap.exists()) {
                setFinancials(prev => ({ ...prev, ...docSnap.data() }));
            }
        }, (err) => console.error("Financials Stream Error:", err));

        const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Client[];
            setClients(data);
        }, (err) => console.error("Clients Stream Error:", err));

        const unsubTransactions = onSnapshot(query(collection(db, "transactions"), orderBy("date", "desc")), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CashTransaction[];
            setCashboxTransactions(data);
        }, (err) => console.error("Transactions Stream Error:", err));

        const unsubTickets = onSnapshot(query(collection(db, "tickets"), orderBy("createdAt", "desc")), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SupportTicket[];
            setTickets(data);
        }, (err) => console.error("Tickets Stream Error:", err));

        const unsubCaseTypes = onSnapshot(collection(db, "caseTypes"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CaseType[];
            const storedIds = new Set(data.map(ct => ct.id));
            const newDefaults = DEFAULT_CASE_TYPES.filter(d => !storedIds.has(d.id));
            setCaseTypes([...data, ...newDefaults]);
        }, (err) => console.error("CaseTypes Stream Error:", err));

        return () => {
            unsubEmployees();
            unsubTaskLogs();
            unsubFinancials();
            unsubClients();
            unsubTransactions();
            unsubTickets();
            unsubCaseTypes();
        };
    }, []);

    // 3. Keep local storage in sync as a secondary cache
    useEffect(() => {
        const data = { employees, taskLogs, financials, clients, cashboxTransactions, tickets, caseTypes };
        localStorage.setItem("law-firm-os-data", JSON.stringify(data));
    }, [employees, taskLogs, financials, clients, cashboxTransactions, tickets, caseTypes]);

    const refreshEmployees = async () => {
        if (!isConfigured) return;
        try {
            const snapshot = await getDocs(collection(db, "employees"));
            const data = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as Employee[];
            console.log(`[Manual Refresh] Loaded ${data.length} employees`);
            setEmployees(data);
        } catch (e) {
            console.error("[Manual Refresh] Failed to load employees:", e);
        }
    };

    const addEmployee = async (employee: Employee) => {
        if (isConfigured) {
            try {
                // If the employee already has an business ID, use it, otherwise let firestore generate
                const docRef = employee.id && employee.id.length > 5
                    ? doc(db, "employees", employee.id)
                    : doc(collection(db, "employees"));

                const finalEmployee = { ...employee, id: docRef.id };
                await setDoc(docRef, finalEmployee);
                console.log(`[Cloud] Saved employee: ${finalEmployee.name} with ID: ${docRef.id}`);
            } catch (error) {
                console.error(`[Firestore] Error adding employee:`, error);
                throw error;
            }
        } else {
            console.log("[Local] Saving employee to local state");
            const finalEmployee = {
                ...employee,
                id: employee.id || Math.random().toString(36).substr(2, 9)
            };
            setEmployees((prev) => [...prev, finalEmployee]);
        }
    };

    const updateEmployee = async (id: string, updates: Partial<Employee>) => {
        if (isConfigured) {
            await updateDoc(doc(db, "employees", id), updates);
        } else {
            setEmployees((prev) =>
                prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
            );
        }
    };

    const addTaskLog = async (log: TaskLog) => {
        if (isConfigured) {
            await addDoc(collection(db, "taskLogs"), log);
        } else {
            setTaskLogs((prev) => [...prev, log]);
        }
    };

    const updateFinancials = async (data: Partial<FinancialData>) => {
        if (isConfigured) {
            await setDoc(doc(db, "settings", "financials"), data, { merge: true });
        } else {
            setFinancials((prev) => ({ ...prev, ...data }));
        }
    };

    const addClient = async (client: Client) => {
        if (isConfigured) {
            try {
                await setDoc(doc(db, "clients", client.id), client);
            } catch (error) {
                console.error(`[Firestore] Error adding client ${client.id}:`, error);
                throw error;
            }
        } else {
            console.log("[Local] Saving client to local state");
            setClients((prev) => [...prev, client]);
        }
    };

    const updateClient = async (id: string, updates: Partial<Client>) => {
        if (isConfigured) {
            await updateDoc(doc(db, "clients", id), updates);
        } else {
            setClients((prev) =>
                prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
            );
        }
    };

    const addCashTransaction = async (transaction: CashTransaction) => {
        if (isConfigured) {
            await setDoc(doc(db, "transactions", transaction.id), transaction);
            // Also update balance in financials
            const newBalance = transaction.type === 'in'
                ? financials.cashboxBalance + transaction.amount
                : financials.cashboxBalance - transaction.amount;
            await updateFinancials({ cashboxBalance: newBalance });
        } else {
            setCashboxTransactions(prev => [transaction, ...prev]);
            setFinancials(prev => ({
                ...prev,
                cashboxBalance: transaction.type === 'in'
                    ? prev.cashboxBalance + transaction.amount
                    : prev.cashboxBalance - transaction.amount
            }));
        }
    };

    const addCustomExpense = async (expense: CustomExpense) => {
        const newExpenses = [...(financials.customExpenses || []), expense];
        if (isConfigured) {
            await updateFinancials({ customExpenses: newExpenses });
        } else {
            setFinancials(prev => ({ ...prev, customExpenses: newExpenses }));
        }
    };

    const deleteCustomExpense = async (id: string) => {
        const newExpenses = (financials.customExpenses || []).filter(exp => exp.id !== id);
        if (isConfigured) {
            await updateFinancials({ customExpenses: newExpenses });
        } else {
            setFinancials(prev => ({ ...prev, customExpenses: newExpenses }));
        }
    };

    const addTicket = async (ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => {
        const ticketNums = tickets.map(t => parseInt(t.ticketNumber, 10));
        const highestNum = ticketNums.length > 0 ? Math.max(...ticketNums) : 0;
        const nextNumber = (highestNum + 1).toString().padStart(5, '0');
        const id = Math.random().toString(36).substr(2, 9);

        const newTicket: SupportTicket = {
            ...ticket,
            id,
            ticketNumber: nextNumber,
            status: "open",
            createdAt: new Date().toISOString()
        };

        if (isConfigured) {
            try {
                await setDoc(doc(db, "tickets", id), newTicket);
            } catch (error) {
                console.error(`[Firestore] Error adding ticket ${id}:`, error);
                throw error;
            }
        } else {
            console.log("[Local] Saving ticket to local state");
            setTickets(prev => [newTicket, ...prev]);
        }
    };

    const resolveTicket = async (id: string, resolution: string) => {
        const updates = { status: "resolved" as const, resolution, resolvedAt: new Date().toISOString() };
        if (isConfigured) {
            await updateDoc(doc(db, "tickets", id), updates);
        } else {
            setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        }
    };

    const addCaseType = async (caseType: Omit<CaseType, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newCaseType = { ...caseType, id };
        if (isConfigured) {
            await setDoc(doc(db, "caseTypes", id), newCaseType);
        } else {
            setCaseTypes(prev => [...prev, newCaseType]);
        }
    };

    const updateCaseType = async (id: string, updates: Partial<CaseType>) => {
        if (isConfigured) {
            await updateDoc(doc(db, "caseTypes", id), updates);
        } else {
            setCaseTypes(prev => prev.map(ct => ct.id === id ? { ...ct, ...updates } : ct));
        }
    };

    const deleteCaseType = async (id: string) => {
        if (isConfigured) {
            await deleteDoc(doc(db, "caseTypes", id));
        } else {
            setCaseTypes(prev => prev.filter(ct => ct.id !== id));
        }
    };

    return (
        <FirmContext.Provider
            value={{
                employees,
                taskLogs,
                financials: exposedFinancials,
                clients,
                addEmployee,
                updateEmployee,
                addTaskLog,
                updateFinancials,
                addClient,
                updateClient,
                cashboxTransactions,
                addCashTransaction,
                addCustomExpense,
                deleteCustomExpense,
                tickets,
                addTicket,
                resolveTicket,
                caseTypes,
                addCaseType,
                updateCaseType,
                deleteCaseType,
                dailyBurnMetrics,
                isCloudSyncActive: isConfigured,
                firebaseProjectId: isConfigured ? (db as any)._databaseId.projectId : null,
                refreshEmployees
            }}
        >
            {children}
        </FirmContext.Provider>
    );
}

export function useFirmData() {
    const context = useContext(FirmContext);
    if (context === undefined) {
        throw new Error("useFirmData must be used within a FirmProvider");
    }
    return context;
}
