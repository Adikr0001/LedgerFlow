import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity, ArrowDownLeft, ArrowUpRight, ArrowUpRightFromSquare, BadgeCheck, Banknote,
  ChevronLeft, ChevronRight, CircleAlert, Clock3, FileSearch, Plus, RefreshCw,
  Search, ShieldAlert, WalletCards,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";
import { api } from "../lib/api";
import { dateTime, idempotencyKey, money } from "../lib/utils";
import type { Transaction, Wallet } from "../types/api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Field, FormField, Select } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";

function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-start gap-2"><CircleAlert size={17} className="mt-0.5 shrink-0" />{message}</span>{retry && <Button variant="secondary" size="sm" onClick={retry}><RefreshCw size={14} /> Retry</Button>}</div>;
}

function LoadingCard({ label = "Loading your LedgerFlow data…" }: { label?: string }) {
  return <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-line bg-white text-sm text-muted"><span className="size-4 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />{label}</div>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center"><span className="mb-3 grid size-11 place-items-center rounded-2xl bg-[#edf7f3] text-brand"><WalletCards size={20} /></span><h3 className="font-semibold text-ink">{title}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-muted">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-brand">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</p></div>{action}</div>;
}

function TransactionRows({ transactions, onSelect }: { transactions: Transaction[]; onSelect: (id: number) => void }) {
  if (!transactions.length) return <EmptyState title="No transactions yet" description="When money moves through your wallets, you’ll find the full story here." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-y border-line text-xs font-medium text-muted"><th className="px-5 py-3 font-medium">Transaction</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Amount</th><th className="w-8 px-5 py-3" /></tr></thead><tbody>{transactions.map((tx) => <tr key={tx.id} className="border-b border-line last:border-0 hover:bg-canvas/70">
    <td className="px-5 py-3.5"><button className="flex items-center gap-3 text-left" onClick={() => onSelect(tx.id)}><span className={`grid size-9 place-items-center rounded-xl ${tx.type === "DEPOSIT" ? "bg-emerald-50 text-emerald-700" : tx.type === "REVERSAL" ? "bg-slate-100 text-slate-600" : "bg-[#eff4ff] text-blue-700"}`}>{tx.type === "DEPOSIT" ? <ArrowDownLeft size={17} /> : tx.type === "REVERSAL" ? <RefreshCw size={16} /> : <ArrowUpRight size={17} />}</span><span><span className="block font-semibold text-ink">{tx.type === "DEPOSIT" ? "Deposit" : tx.type === "REVERSAL" ? "Reversal" : "Transfer"}</span><span className="block text-xs text-muted">{tx.transactionRef || `#${tx.id}`}</span></span></button></td>
    <td className="px-5 py-3.5 text-muted">{dateTime(tx.createdAt)}</td><td className="px-5 py-3.5"><StatusBadge status={tx.status} /></td><td className={`px-5 py-3.5 text-right font-semibold tabular-nums ${tx.type === "DEPOSIT" ? "text-emerald-700" : "text-ink"}`}>{tx.type === "DEPOSIT" ? "+" : tx.type === "TRANSFER" ? "−" : ""}{money(tx.amount, tx.currency)}</td><td className="px-5 py-3.5"><button className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-brand" aria-label={`View transaction ${tx.id}`} onClick={() => onSelect(tx.id)}><ArrowUpRightFromSquare size={15} /></button></td>
  </tr>)}</tbody></table></div>;
}

export function OverviewPage() {
  const wallets = useQuery({ queryKey: ["wallets"], queryFn: api.wallets });
  const transactions = useQuery({ queryKey: ["transactions", 0, 8], queryFn: () => api.transactions(0, 8) });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: api.notifications });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const txs = transactions.data?.content ?? [];
  const chartData = useMemo(() => [...txs].reverse().map((tx) => ({
    label: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(tx.createdAt)),
    amount: Number(tx.amount),
  })), [txs]);
  const currencies = [...new Set((wallets.data ?? []).map((wallet) => wallet.currency))];
  return <>
    <PageIntro eyebrow="YOUR MONEY, AT A GLANCE" title="A little more clarity." description="A calm overview of your wallets and recent activity." />
    {(wallets.isError || transactions.isError) && <div className="mb-5"><ErrorNotice message={(wallets.error ?? transactions.error) instanceof Error ? (wallets.error ?? transactions.error)!.message : "Some dashboard data could not be loaded."} retry={() => { void wallets.refetch(); void transactions.refetch(); }} /></div>}
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="relative overflow-hidden bg-[#123e34] text-white md:col-span-2"><div className="absolute -right-16 -top-28 size-64 rounded-full border border-white/10" /><div className="absolute -right-8 -top-20 size-48 rounded-full border border-white/10" /><CardContent className="relative p-6 sm:p-8">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-white/70"><span className="grid size-8 place-items-center rounded-lg bg-white/10 text-[#d8f36a]"><WalletCards size={17} /></span> Wallet overview</div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">{wallets.data?.length ?? 0} wallet{wallets.data?.length === 1 ? "" : "s"}</span></div>
        <p className="mt-8 text-xs font-medium uppercase tracking-[0.16em] text-white/55">Your wallets</p>
        <div className="mt-3 flex flex-wrap gap-2">{wallets.isLoading ? <span className="text-sm text-white/60">Loading balances…</span> : currencies.length ? currencies.map((currency) => <span key={currency} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold">{currency} · {(wallets.data ?? []).filter((wallet) => wallet.currency === currency).length} account(s)</span>) : <span className="text-sm text-white/60">Create your first wallet to get started.</span>}</div>
        <p className="mt-6 max-w-md text-xs leading-5 text-white/55">Balances remain tied to each wallet and currency. View wallet details for the exact amount—no cross-currency totals are estimated.</p>
      </CardContent></Card>
      <Card><CardContent className="flex h-full flex-col justify-between p-6"><div className="flex items-center justify-between"><span className="text-sm font-medium text-muted">Recent activity</span><Activity size={18} className="text-brand" /></div><p className="mt-7 text-4xl font-semibold tracking-tight text-ink">{transactions.data?.totalElements ?? "—"}</p><p className="mt-1 text-sm text-muted">recorded transactions</p><div className="mt-6 flex items-center gap-2 text-xs text-muted"><span className="size-2 rounded-full bg-brand" />{notifications.data?.filter((item) => !item.readFlag).length ?? 0} unread notifications</div></CardContent></Card>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <Card><CardHeader><div><CardTitle>Activity at a glance</CardTitle><p className="mt-1 text-xs text-muted">Recent transaction amounts · visualization only</p></div><span className="rounded-lg bg-[#edf7f3] p-2 text-brand"><Activity size={17} /></span></CardHeader><CardContent className="h-64">
        {transactions.isLoading ? <div className="grid h-full place-items-center text-sm text-muted">Loading activity…</div> : chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#127c63" stopOpacity={0.18} /><stop offset="100%" stopColor="#127c63" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf0ed" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#77817b", fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#77817b", fontSize: 11 }} /><Tooltip formatter={(value: number) => [new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value), "Amount"]} contentStyle={{ borderRadius: 12, borderColor: "#e8ece9" }} /><Area type="monotone" dataKey="amount" stroke="#127c63" strokeWidth={2.5} fill="url(#activityFill)" /></AreaChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-sm text-muted">Your activity chart will appear after your first transaction.</div>}
      </CardContent></Card>
      <Card><CardHeader><div><CardTitle>Your wallets</CardTitle><p className="mt-1 text-xs text-muted">Balances by account and currency</p></div><WalletCards size={18} className="text-brand" /></CardHeader><CardContent>
        {wallets.isLoading ? <div className="py-5 text-sm text-muted">Loading wallets…</div> : wallets.data?.length ? <div className="space-y-3">{wallets.data.slice(0, 4).map((wallet) => <WalletSummary key={wallet.id} wallet={wallet} />)}</div> : <EmptyState title="Your first wallet awaits" description="Create a wallet to start organizing your money." />}
      </CardContent></Card>
    </div>
    <Card className="mt-5"><CardHeader><div><CardTitle>Latest transactions</CardTitle><p className="mt-1 text-xs text-muted">A live feed from your LedgerFlow account</p></div><Clock3 size={18} className="text-muted" /></CardHeader>
      {transactions.isLoading ? <CardContent><div className="py-12 text-center text-sm text-muted">Fetching your activity…</div></CardContent> : <TransactionRows transactions={txs} onSelect={setSelectedId} />}
    </Card>
    <TransactionDetails id={selectedId} onClose={() => setSelectedId(null)} />
  </>;
}

function WalletSummary({ wallet }: { wallet: Wallet }) {
  return <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf7f3] text-brand"><Banknote size={17} /></span><span><span className="block text-sm font-semibold text-ink">{wallet.currency} wallet</span><span className="block text-xs text-muted">Account ···· {String(wallet.id).slice(-4)}</span></span></div><span className="text-right"><span className="block text-sm font-semibold tabular-nums text-ink">{money(wallet.balance, wallet.currency)}</span><StatusBadge status={wallet.status} /></span></div>;
}

const createWalletSchema = z.object({ currency: z.string().length(3, "Select a currency") });
const isPositiveDecimal = (value: string) => /[1-9]/.test(value.replace(".", ""));
const amountSchema = z.string().regex(/^\d+(\.\d{1,4})?$/, "Enter a positive amount with up to 4 decimal places").refine(isPositiveDecimal, "Amount must be greater than zero");
const depositSchema = z.object({ walletId: z.coerce.number().positive("Choose a wallet"), amount: amountSchema });

export function WalletsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["wallets"], queryFn: api.wallets });
  const [createOpen, setCreateOpen] = useState(false);
  const [depositWallet, setDepositWallet] = useState<Wallet | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const depositRequestKey = useRef<string | null>(null);
  const createForm = useForm<z.infer<typeof createWalletSchema>>({ resolver: zodResolver(createWalletSchema), defaultValues: { currency: "USD" } });
  const depositForm = useForm<z.infer<typeof depositSchema>>({ resolver: zodResolver(depositSchema) });
  const openDeposit = (wallet: Wallet) => {
    setError("");
    if (depositWallet && depositWallet.id !== wallet.id) depositRequestKey.current = null;
    setDepositWallet(wallet);
    depositForm.setValue("walletId", wallet.id);
  };
  const create = useMutation({
    mutationFn: (currency: string) => api.createWallet(currency),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["wallets"] }); setCreateOpen(false); setFeedback("Wallet created."); setError(""); createForm.reset({ currency: "USD" }); },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Could not create wallet."),
  });
  const deposit = useMutation({
    mutationFn: ({ walletId, amount }: { walletId: number; amount: string }) => {
      const wallet = query.data?.find((item) => item.id === walletId);
      if (!wallet) throw new Error("Choose a valid wallet.");
      depositRequestKey.current ??= idempotencyKey("deposit");
      return api.deposit(walletId, amount, wallet.currency, depositRequestKey.current);
    },
    onSuccess: async () => { depositRequestKey.current = null; await Promise.all([queryClient.invalidateQueries({ queryKey: ["wallets"] }), queryClient.invalidateQueries({ queryKey: ["transactions"] })]); setDepositWallet(null); setFeedback("Simulated deposit recorded."); setError(""); depositForm.reset(); },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Could not record deposit."),
  });
  return <>
    <PageIntro eyebrow="ACCOUNTS & BALANCES" title="Your wallets." description="Keep currencies separate, and see each balance straight from the LedgerFlow API." action={<div className="flex gap-2"><Button variant="secondary" onClick={() => query.data?.[0] && openDeposit(query.data[0])} disabled={!query.data?.length}><ArrowDownLeft size={16} /> Simulate deposit</Button><Button onClick={() => { setError(""); setCreateOpen(true); }}><Plus size={17} /> New wallet</Button></div>} />
    {feedback && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</p>}
    {error && <div className="mb-4"><ErrorNotice message={error} /></div>}
    {query.isError ? <ErrorNotice message={query.error instanceof Error ? query.error.message : "Wallets could not be loaded."} retry={() => void query.refetch()} /> : query.isLoading ? <LoadingCard label="Loading your wallets…" /> : query.data?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{query.data.map((wallet) => <Card key={wallet.id} className="overflow-hidden"><div className="h-1.5 bg-brand" /><CardContent className="p-5"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#edf7f3] text-brand"><Banknote size={20} /></span><StatusBadge status={wallet.status} /></div><p className="mt-6 text-xs font-medium uppercase tracking-[0.15em] text-muted">{wallet.currency} WALLET</p><p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{money(wallet.balance, wallet.currency)}</p><p className="mt-2 text-xs text-muted">Account ID · {wallet.id}</p><div className="mt-5 flex gap-2"><Button size="sm" className="flex-1" onClick={() => openDeposit(wallet)}>Add funds</Button></div></CardContent></Card>)}</div> : <Card><EmptyState title="No wallets yet" description="Create a wallet in a currency you use. Balances always stay within their wallet." action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Create a wallet</Button>} /></Card>}
    <Dialog open={createOpen} onOpenChange={setCreateOpen} title="Create a wallet" description="A new wallet starts with a zero balance.">
      <form onSubmit={createForm.handleSubmit((values) => create.mutate(values.currency))} className="space-y-4">
        <FormField label="Currency" error={createForm.formState.errors.currency?.message}><Select {...createForm.register("currency")}><option value="USD">US Dollar · USD</option><option value="INR">Indian Rupee · INR</option><option value="EUR">Euro · EUR</option><option value="GBP">Pound Sterling · GBP</option><option value="CAD">Canadian Dollar · CAD</option></Select></FormField>
        {create.isError && <ErrorNotice message={create.error instanceof Error ? create.error.message : "Could not create wallet."} />}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create wallet"}</Button></div>
      </form>
    </Dialog>
    <Dialog open={!!depositWallet} onOpenChange={(open) => !open && setDepositWallet(null)} title="Simulate a deposit" description="For demonstration only. This endpoint credits your wallet and records a ledger transaction.">
      <form onSubmit={depositForm.handleSubmit((values) => deposit.mutate({ walletId: values.walletId, amount: values.amount }))} className="space-y-4">
        <FormField label="Wallet"><Select value={depositWallet?.id ?? ""} onChange={(event) => { const id = Number(event.target.value); const wallet = query.data?.find((item) => item.id === id) ?? null; if (wallet) { depositRequestKey.current = null; openDeposit(wallet); } }}><option value="" disabled>Select wallet</option>{query.data?.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.currency} · account {wallet.id}</option>)}</Select></FormField>
        <input type="hidden" {...depositForm.register("walletId")} />
        <FormField label={`Amount${depositWallet ? ` (${depositWallet.currency})` : ""}`} error={depositForm.formState.errors.amount?.message}><Field inputMode="decimal" placeholder="0.00" {...depositForm.register("amount", { onChange: () => { depositRequestKey.current = null; } })} /></FormField>
        {deposit.isError && <ErrorNotice message={deposit.error instanceof Error ? deposit.error.message : "Could not process deposit."} />}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={() => setDepositWallet(null)}>Cancel</Button><Button type="submit" disabled={deposit.isPending}>{deposit.isPending ? "Processing…" : "Confirm deposit"}</Button></div>
      </form>
    </Dialog>
  </>;
}

const transferSchema = z.object({
  sourceWalletId: z.coerce.number().positive("Choose a wallet to send from"),
  targetWalletId: z.coerce.number().int().positive("Enter a valid destination wallet ID"),
  amount: amountSchema,
}).refine((values) => values.sourceWalletId !== values.targetWalletId, { message: "Choose two different wallets", path: ["targetWalletId"] });

export function TransfersPage() {
  const queryClient = useQueryClient();
  const wallets = useQuery({ queryKey: ["wallets"], queryFn: api.wallets });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const transferRequestKey = useRef<string | null>(null);
  const form = useForm<z.infer<typeof transferSchema>>({ resolver: zodResolver(transferSchema) });
  const transfer = useMutation({
    mutationFn: (values: z.infer<typeof transferSchema>) => {
      const source = wallets.data?.find((item) => item.id === values.sourceWalletId);
      if (!source) throw new Error("Choose a valid source wallet.");
      transferRequestKey.current ??= idempotencyKey("transfer");
      return api.transfer(source.id, values.targetWalletId, values.amount, source.currency, transferRequestKey.current);
    },
    onSuccess: async (result) => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["wallets"] }), queryClient.invalidateQueries({ queryKey: ["transactions"] })]);
      setSuccess(`Transfer submitted. Transaction #${result.transactionId} is ${result.status.toLowerCase()}.`);
      setError("");
      transferRequestKey.current = null;
      form.reset();
    },
    onError: (reason) => { setSuccess(""); setError(reason instanceof Error ? reason.message : "Transfer could not be completed."); },
  });
  const sourceId = form.watch("sourceWalletId");
  const source = wallets.data?.find((item) => item.id === sourceId);
  return <>
    <PageIntro eyebrow="MOVE MONEY" title="Send a transfer." description="Choose one of your wallets and a destination wallet. LedgerFlow checks available funds and records both sides of the transfer." />
    {wallets.isError && <div className="mb-4"><ErrorNotice message={wallets.error instanceof Error ? wallets.error.message : "Wallets could not be loaded."} retry={() => void wallets.refetch()} /></div>}
    {success && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
    {error && <div className="mb-4"><ErrorNotice message={error} /></div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card><CardHeader><div><CardTitle>Transfer details</CardTitle><p className="mt-1 text-xs text-muted">Enter an amount to submit a real transfer request.</p></div><span className="rounded-xl bg-[#edf7f3] p-2.5 text-brand"><ArrowUpRight size={18} /></span></CardHeader><CardContent>
        {wallets.isLoading ? <div className="py-8 text-sm text-muted">Loading available wallets…</div> : wallets.data?.length ? <form className="max-w-xl space-y-5" onSubmit={form.handleSubmit((values) => transfer.mutate(values))} noValidate>
          <FormField label="From wallet" error={form.formState.errors.sourceWalletId?.message}><Select {...form.register("sourceWalletId", { onChange: () => { transferRequestKey.current = null; } })}><option value="">Select the wallet to send from</option>{wallets.data.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.currency} · account {wallet.id} · {money(wallet.balance, wallet.currency)}</option>)}</Select></FormField>
          <div className="flex justify-center"><span className="grid size-9 place-items-center rounded-full border border-line bg-canvas text-muted"><ArrowDownLeft size={17} /></span></div>
          <FormField label="To wallet" error={form.formState.errors.targetWalletId?.message}><Field type="number" inputMode="numeric" min="1" step="1" placeholder="Recipient wallet ID" {...form.register("targetWalletId", { onChange: () => { transferRequestKey.current = null; } })} /><span className="text-xs font-normal text-muted">Ask the recipient for their LedgerFlow wallet ID.</span></FormField>
          <FormField label={`Amount${source ? ` (${source.currency})` : ""}`} error={form.formState.errors.amount?.message}><Field inputMode="decimal" placeholder="0.00" aria-describedby="amount-hint" {...form.register("amount", { onChange: () => { transferRequestKey.current = null; } })} /><span id="amount-hint" className="text-xs font-normal text-muted">Use up to 4 decimal places. Available balance is checked by the API.</span></FormField>
          <div className="rounded-xl bg-canvas p-4 text-sm"><div className="flex justify-between gap-3"><span className="text-muted">Transfer type</span><span className="font-medium text-ink">Wallet to wallet</span></div><div className="mt-2 flex justify-between gap-3"><span className="text-muted">Processing fee</span><span className="font-medium text-ink">No fee</span></div><p className="mt-3 border-t border-line pt-3 text-xs leading-5 text-muted">Transfers are immediate and cannot be cancelled once completed. Eligible completed transfers can be reversed.</p></div>
          <Button type="submit" className="w-full sm:w-auto" disabled={transfer.isPending}>{transfer.isPending ? "Submitting transfer…" : "Review and send"} <ArrowUpRight size={16} /></Button>
        </form> : <EmptyState title="Create a wallet first" description="Transfers need an active wallet. Create at least one wallet to get started." />}
      </CardContent></Card>
      <div className="space-y-4"><Card className="bg-[#123e34] text-white"><CardContent className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#d8f36a]"><BadgeCheck size={20} /></span><h3 className="mt-4 font-semibold">Protected by the ledger</h3><p className="mt-2 text-sm leading-6 text-white/65">Transfers are recorded with balanced debit and credit entries. The backend is the source of truth for balances and authorization.</p></CardContent></Card>
        <Card><CardContent className="p-5"><h3 className="text-sm font-semibold text-ink">Before you send</h3><ul className="mt-3 space-y-2.5 text-xs leading-5 text-muted"><li>• Both wallets must use the same currency.</li><li>• Your account must own the sending wallet.</li><li>• Your available balance must cover the amount.</li><li>• Keep your transaction reference for your records.</li></ul></CardContent></Card></div>
    </div>
  </>;
}

export function TransactionsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const query = useQuery({ queryKey: ["transactions", page, 20], queryFn: () => api.transactions(page, 20) });
  const filtered = (query.data?.content ?? []).filter((tx) => (status === "ALL" || tx.status === status) && `${tx.transactionRef} ${tx.type} ${tx.id}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <PageIntro eyebrow="YOUR MONEY, ACCOUNTED FOR" title="Transaction history." description="A paginated record of transactions from your account. Select a row to see the full details and reversal eligibility." />
    {query.isError && <div className="mb-4"><ErrorNotice message={query.error instanceof Error ? query.error.message : "Transactions could not be loaded."} retry={() => void query.refetch()} /></div>}
    <Card><CardHeader className="flex-col sm:flex-row sm:items-center"><div><CardTitle>All activity</CardTitle><p className="mt-1 text-xs text-muted">{query.data?.totalElements ?? "—"} transactions recorded</p></div><div className="flex w-full gap-2 sm:w-auto"><div className="relative flex-1 sm:w-52"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><Field value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page" className="h-10 pl-9" aria-label="Search transactions on this page" /></div><Select aria-label="Filter by status on this page" className="h-10 w-auto min-w-32" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option><option value="REVERSED">Reversed</option><option value="FAILED">Failed</option></Select></div></CardHeader>
      {query.isLoading ? <CardContent><div className="py-12 text-center text-sm text-muted">Loading your history…</div></CardContent> : <><TransactionRows transactions={filtered} onSelect={setSelectedId} /><div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted">Showing page {(query.data?.number ?? 0) + 1} of {query.data?.totalPages ?? 1}. Filters apply to this page.</p><div className="flex items-center gap-2"><Button size="sm" variant="secondary" disabled={!query.data || query.data.first} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={15} /> Previous</Button><Button size="sm" variant="secondary" disabled={!query.data || query.data.last} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={15} /></Button></div></div></>}
    </Card>
    <TransactionDetails id={selectedId} onClose={() => setSelectedId(null)} />
  </>;
}

function TransactionDetails({ id, onClose }: { id: number | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["transaction", id], queryFn: () => api.transaction(id!), enabled: id !== null, retry: 1 });
  const [feedback, setFeedback] = useState("");
  const reversal = useMutation({
    mutationFn: () => api.reverse(id!, idempotencyKey("reversal")),
    onSuccess: async (result) => {
      setFeedback(`Reversal recorded as transaction #${result.transactionId}.`);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["transaction", id] }), queryClient.invalidateQueries({ queryKey: ["transactions"] }), queryClient.invalidateQueries({ queryKey: ["wallets"] })]);
    },
  });
  const tx = query.data;
  const eligible = tx?.type === "TRANSFER" && tx.status === "COMPLETED";
  return <Dialog open={id !== null} onOpenChange={(open) => !open && onClose()} title="Transaction details" description={id ? `Transaction #${id}` : undefined}>
    {query.isLoading ? <div className="py-8 text-sm text-muted">Loading transaction…</div> : query.isError ? <ErrorNotice message={query.error instanceof Error ? query.error.message : "Transaction details could not be loaded."} retry={() => void query.refetch()} /> : tx ? <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-canvas p-4"><div><p className="text-xs text-muted">Amount</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{money(tx.amount, tx.currency)}</p></div><StatusBadge status={tx.status} /></div>
      <DetailRow label="Type" value={tx.type} /><DetailRow label="Reference" value={tx.transactionRef} /><DetailRow label="Created" value={dateTime(tx.createdAt)} /><DetailRow label="From wallet" value={tx.sourceWalletId === null ? "External / none" : `Account ${tx.sourceWalletId}`} /><DetailRow label="To wallet" value={tx.targetWalletId === null ? "External / none" : `Account ${tx.targetWalletId}`} />
      {tx.originalTransactionId !== null && <DetailRow label="Original transaction" value={`#${tx.originalTransactionId}`} />}
      {feedback && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}
      {reversal.isError && <ErrorNotice message={reversal.error instanceof Error ? reversal.error.message : "Reversal request failed."} />}
      {eligible && <div className="border-t border-line pt-4"><p className="mb-3 text-xs leading-5 text-muted">This transfer is completed and can be reversed if the recipient still has sufficient funds. Reversal creates a separate compensating transaction.</p><Button variant="secondary" onClick={() => reversal.mutate()} disabled={reversal.isPending}>{reversal.isPending ? "Requesting reversal…" : "Request reversal"} <RefreshCw size={15} /></Button></div>}
    </div> : null}
  </Dialog>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-line pb-3 text-sm last:border-0"><span className="text-muted">{label}</span><span className="text-right font-medium text-ink">{value}</span></div>;
}

export function AdminPage() {
  const audit = useQuery({ queryKey: ["admin", "audit"], queryFn: api.auditEvents });
  const reconciliation = useQuery({ queryKey: ["admin", "reconciliation"], queryFn: api.reconciliation });
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, retry: 1 });
  return <>
    <PageIntro eyebrow="ADMINISTRATOR WORKSPACE" title="Operations & oversight." description="Live audit and reconciliation data from protected LedgerFlow admin endpoints." />
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted">API health</p><p className="mt-2 text-lg font-semibold text-ink">{health.isLoading ? "Checking…" : health.data?.status ?? (health.isError ? "Unavailable" : "Unknown")}</p></div><span className="rounded-xl bg-[#edf7f3] p-3 text-brand"><Activity size={19} /></span></CardContent></Card>
      <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted">Audit events</p><p className="mt-2 text-lg font-semibold text-ink">{audit.data?.length ?? (audit.isLoading ? "…" : "Unavailable")}</p></div><FileSearch size={20} className="text-brand" /></CardContent></Card>
      <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted">Reconciliation reports</p><p className="mt-2 text-lg font-semibold text-ink">{reconciliation.data?.length ?? (reconciliation.isLoading ? "…" : "Unavailable")}</p></div><ShieldAlert size={20} className="text-brand" /></CardContent></Card>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card><CardHeader><div><CardTitle>Reconciliation</CardTitle><p className="mt-1 text-xs text-muted">Reports from the backend reconciliation job</p></div><BadgeCheck size={18} className="text-brand" /></CardHeader>
        {reconciliation.isError ? <CardContent><ErrorNotice message={reconciliation.error instanceof Error ? reconciliation.error.message : "Could not load reconciliation reports."} retry={() => void reconciliation.refetch()} /></CardContent> : reconciliation.isLoading ? <CardContent><p className="py-8 text-center text-sm text-muted">Loading reports…</p></CardContent> : reconciliation.data?.length ? <div className="divide-y divide-line">{[...reconciliation.data].reverse().slice(0, 15).map((report) => <div key={report.id} className="flex items-start justify-between gap-3 px-5 py-4"><div><p className="font-semibold text-ink">{report.reportRef}</p><p className="mt-1 max-w-lg break-words text-xs leading-5 text-muted">{report.discrepancies}</p><p className="mt-1 text-[11px] text-muted">{dateTime(report.createdAt)}</p></div><StatusBadge status={report.status} /></div>)}</div> : <EmptyState title="No reports yet" description="The backend reconciliation scheduler will publish results here." />}
      </Card>
      <Card><CardHeader><div><CardTitle>Audit trail</CardTitle><p className="mt-1 text-xs text-muted">Recent system and financial events</p></div><FileSearch size={18} className="text-brand" /></CardHeader>
        {audit.isError ? <CardContent><ErrorNotice message={audit.error instanceof Error ? audit.error.message : "Could not load audit events."} retry={() => void audit.refetch()} /></CardContent> : audit.isLoading ? <CardContent><p className="py-8 text-center text-sm text-muted">Loading audit events…</p></CardContent> : audit.data?.length ? <div className="max-h-[560px] divide-y divide-line overflow-y-auto">{[...audit.data].reverse().slice(0, 30).map((event) => <div key={event.id} className="px-5 py-4"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-ink">{event.eventType}</p><span className="text-[11px] text-muted">{dateTime(event.createdAt)}</span></div><p className="mt-1 break-words text-xs leading-5 text-muted">{event.payload || "No additional event details."}</p><p className="mt-1 text-[11px] text-muted">Actor {event.actorUserId ?? "system"} · transaction {event.transactionId ?? "—"}</p></div>)}</div> : <EmptyState title="No audit events yet" description="API audit events will appear here when available." />}
      </Card>
    </div>
    <Card className="mt-5 border-amber-200 bg-amber-50/60"><CardContent className="flex items-start gap-3 p-5"><ShieldAlert size={19} className="mt-0.5 shrink-0 text-amber-700" /><div><h3 className="text-sm font-semibold text-amber-950">Fraud flags are not available from this API</h3><p className="mt-1 text-sm leading-6 text-amber-900/75">This backend currently exposes audit events and reconciliation reports, but no fraud-flag endpoint or review workflow. No placeholder or fabricated fraud data is shown.</p></div></CardContent></Card>
  </>;
}
