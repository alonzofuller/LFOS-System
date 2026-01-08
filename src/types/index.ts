export type CaseType = {
    id: string;
    name: string;
    estimatedHours: number;
};

export type Employee = {
    id: string;
    name: string;
    role: string;
    hourlyCost: number; // Cost to the firm per hour
    salary?: number; // Monthly or annual salary
    dailyHours: number; // How many hours this employee works per day (not all work 8)
    dailyTarget: number; // Target billing or revenue
};

export type TaskLog = {
    id: string;
    employeeId: string;
    date: string; // ISO date string YYYY-MM-DD
    description: string;
    hours: number;
    laborCost: number; // Calculated: hours * employee hourly cost
    productionCost: number; // Calculated: laborCost + (hours * fixedOverheadHourly)
    status: "completed" | "blocked" | "in-progress";
};

export type CustomExpense = {
    id: string;
    name: string;
    amount: number;
};

export type FinancialData = {
    fixedOverheadHourly: number; // Derived
    monthlyLease: number;
    payroll: number;
    clio: number; // Clio Case Management
    phone: number;
    wifi: number; // Frontier Wi-Fi
    printer: number; // Kirbo Printer
    postage: number;
    efile: number;
    supplies: number;
    chargebacks: number;
    staffLunch: number;
    otherMonthlyExpenses: number; // Catch-all
    customExpenses: CustomExpense[]; // Dynamic add/delete expenses
    cashOnHand: number;
    debt: number;
    cashboxBalance: number;
};

export type CashTransaction = {
    id: string;
    date: string;
    type: "in" | "out";
    paymentMethod: "cash" | "check"; // Track if cash or check
    category: "Initial" | "Client Payment" | "Supplies" | "Stamps" | "CNB Bank" | "Bonus Pay" | "Borrow" | "Barter" | "Lunch/Snacks" | "Office Repairs" | "Other";
    amount: number;
    description: string;
    senderOrRecipient: string; // Who sent the cash/check or who received it
    performedBy: string;
};

export type IncomeEntry = {
    id: string;
    date: string;
    amount: number;
    clientName: string; // or link to Client ID
    description: string;
    category: "Retainer" | "Monthly Fee" | "Flat Fee" | "Consultation" | "Other";
    method: "Cash" | "Check" | "Credit Card" | "Zelle" | "Wire";
    notes?: string;
};

export type Client = {
    id: string;
    name: string; // The Inmate
    sponsorName: string; // The Payer
    caseType: string;
    status: "active" | "risk" | "churned";
    retainerFee: number;
    monthlyFee: number;
    lastCommunication: string; // ISO Date
    nextPaymentDue: string; // ISO Date
    notes?: string;
    // Flat Fee Case Tracking
    billingType: "hourly" | "flat_fee";
    flatFeeAmount?: number; // Total flat fee for the case
    estimatedHours?: number; // Estimated total hours to complete the case
    hoursLogged?: number; // Running total of hours logged against this case
};

export type SupportTicket = {
    id: string;
    ticketNumber: string; // Format: "00001", "00002", etc.
    subject: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    status: "open" | "in_progress" | "resolved" | "closed";
    createdAt: string; // ISO Date
    submittedBy: string; // Name of person submitting
    resolvedAt?: string; // ISO Date
    resolution?: string;
};
