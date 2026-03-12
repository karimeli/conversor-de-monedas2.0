// src/server/api/routers/currency.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

const RatesSchema = z.object({
  rates: z.record(z.string(), z.number()),
});

export const currencyRouter = createTRPCRouter({
  // Fetch available rates using the environment variable
  getRates: publicProcedure.query(async () => {
    const apiUrl = process.env.EXCHANGE_API_URL;
    if (!apiUrl) throw new Error("EXCHANGE_API_URL is not defined in .env");

    const res = await fetch(apiUrl, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) throw new Error("Failed to fetch rates from the external API");
    
    const data: unknown = await res.json();
    const validatedData = RatesSchema.parse(data);
    return validatedData.rates;
  }),

  // Server-side conversion logic
  convert: publicProcedure
    .input(z.object({
      origen: z.string().min(3).max(3),
      destino: z.string().min(3).max(3),
      cantidad: z.number().positive(),
    }))
    .mutation(async ({ input }: { input: { origen: string; destino: string; cantidad: number } }) => {
      const { origen, destino, cantidad } = input;
      const apiUrl = process.env.EXCHANGE_API_URL;
      if (!apiUrl) throw new Error("EXCHANGE_API_URL is not defined in .env");
      
      const res = await fetch(apiUrl, {
        next: { revalidate: 3600 }
      });
      const data: unknown = await res.json();
      const validatedData = RatesSchema.parse(data);
      const rates = validatedData.rates;

      const rateOrigen = rates[origen];
      const rateDestino = rates[destino];

      if (!rateOrigen || !rateDestino) {
        throw new Error("Currency not supported");
      }

      // Since the base is USD, we convert the source amount to USD first, then to the target currency
      const amountInUSD = cantidad / rateOrigen;
      const finalResult = amountInUSD * rateDestino;

      return {
        resultado: finalResult.toFixed(2)
      };
    }),
});