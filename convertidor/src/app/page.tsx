// src/app/page.tsx
"use client";
import { useEffect, useState, type ReactNode } from "react";

const simbolosMonedas: Record<string, string> = {
  'USD': '$', 'EUR': '€', 'GBP': '£', 'MXN': '$', 'JPY': '¥', 'CAD': '$', 'AUD': '$', 'CHF': 'CHF', 
  'CNY': '¥', 'INR': '₹', 'BRL': 'R$', 'CLP': '$', 'COP': '$', 'PEN': 'S/', 'VES': 'Bs', 'RUB': '₽', 
  'TRY': '₺', 'ZAR': 'R', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'NZD': '$', 'SGD': '$', 'HKD': '$', 
  'KRW': '₩', 'THB': '฿', 'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱', 'SAR': '﷼', 'AED': 'د.إ', 'QAR': '﷼', 
  'KWD': 'د.ك', 'EGP': '£', 'NGN': '₦', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'ILS': '₪', 'PKR': '₨', 
  'BDT': '৳', 'LKR': 'Rs', 'VND': '₫', 'KZT': '₸', 'UAH': '₴', 'BYN': 'Br', 'RSD': 'дин', 'HRK': 'kn', 
  'RON': 'lei', 'BGN': 'лв'
};

export default function Home() {
  const [origen, setOrigen] = useState("USD");
  const [destino, setDestino] = useState("MXN");
  const [cantidad, setCantidad] = useState<number | "">("");
  const [resultadoStr, setResultadoStr] = useState<ReactNode | null>(null);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) throw new Error("No se pudieron obtener las tasas");

        const data = (await res.json()) as { rates?: Record<string, number> };
        setRates(data.rates ?? null);
      } catch {
        setRates(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRates();
  }, []);

  const currencies = rates ? Object.keys(rates) : [];

  const handleConvert = () => {
    if (!rates || !cantidad || Number(cantidad) <= 0) return;

    const rateOrigen = rates[origen];
    const rateDestino = rates[destino];
    if (!rateOrigen || !rateDestino) return;

    setIsConverting(true);

    const amountInUSD = Number(cantidad) / rateOrigen;
    const finalResult = amountInUSD * rateDestino;

    const simOrigen = simbolosMonedas[origen] ?? "";
    const simDestino = simbolosMonedas[destino] ?? "";

    setResultadoStr(
      <>
        <p className="mb-1 text-slate-600">
          <strong>{simOrigen}{cantidad} {origen}</strong> equivale a:
        </p>
        <p className="text-3xl font-bold text-blue-600">
          {simDestino}{finalResult.toFixed(2)} {destino}
        </p>
      </>
    );

    setIsConverting(false);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 font-sans md:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="money-grid" />
        <p className="ticker-line ticker-line-a">USD/MXN +0.42%  EUR/USD +0.18%  GBP/USD -0.07%</p>
        <p className="ticker-line ticker-line-b">JPY/USD +0.31%  CAD/USD +0.12%  BRL/USD -0.15%</p>
        <span className="money-chip money-chip-1">$</span>
        <span className="money-chip money-chip-2">EUR</span>
        <span className="money-chip money-chip-3">MXN</span>
        <span className="money-chip money-chip-4">JPY</span>
        <span className="money-chip money-chip-5">GBP</span>
        <span className="money-chip money-chip-6">$</span>
      </div>

      <div className="float-orb pointer-events-none absolute -left-28 -top-24 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl" />
      <div className="float-orb pointer-events-none absolute -bottom-24 -right-28 h-80 w-80 rounded-full bg-teal-300/35 blur-3xl" />

      <section className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/60 bg-white/85 p-5 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-8">
        <header className="mb-8 flex flex-col gap-3">
          <span className="w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
            Cambio en vivo
          </span>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Convertidor de divisas
          </h1>
          <p className="max-w-xl text-sm text-slate-600 md:text-base">
            Convierte montos en segundos usando tasas internacionales actualizadas en tiempo real.
          </p>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-8 text-center">
            <p className="text-sm font-semibold text-slate-600 animate-pulse md:text-base">
              Conectando con el mercado de divisas...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="origen" className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Moneda origen
                </label>
                <select
                  id="origen"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  {currencies.map((c) => (
                    <option key={`origen-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="destino" className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Moneda destino
                </label>
                <select
                  id="destino"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  {currencies.map((c) => (
                    <option key={`destino-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cantidad</label>
              <input
                type="number"
                placeholder="0.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-lg font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </div>

            <button
              type="button"
              onClick={handleConvert}
              disabled={isConverting || !cantidad}
              className="w-full rounded-2xl bg-teal-700 px-4 py-3.5 text-base font-semibold text-white shadow-[0_12px_28px_-12px_rgba(15,118,110,0.8)] transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isConverting ? "Calculando..." : "Convertir"}
            </button>

            {resultadoStr && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-center">
                {resultadoStr}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}