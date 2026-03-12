import { NextResponse } from "next/server";
import { z } from "zod";

const convertSchema = z.object({
  origen: z.string().min(3).max(3),
  destino: z.string().min(3).max(3),
  cantidad: z.number().positive(),
});

const ratesSchema = z.object({
  rates: z.record(z.string(), z.number()),
});

export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json();
    const { origen, destino, cantidad } = convertSchema.parse(rawBody);

    const exchangeApiUrl = process.env.EXCHANGE_API_URL;
    if (!exchangeApiUrl) {
      return NextResponse.json(
        { error: "EXCHANGE_API_URL no esta configurada" },
        { status: 500 },
      );
    }

    const ratesResponse = await fetch(exchangeApiUrl, {
      next: { revalidate: 3600 },
    });

    if (!ratesResponse.ok) {
      return NextResponse.json(
        { error: "No se pudieron obtener las tasas de cambio" },
        { status: 502 },
      );
    }

    const ratesData: unknown = await ratesResponse.json();
    const parsedRates = ratesSchema.parse(ratesData);

    const rateOrigen = parsedRates.rates[origen];
    const rateDestino = parsedRates.rates[destino];

    if (!rateOrigen || !rateDestino) {
      return NextResponse.json(
        { error: "Monedas no soportadas" },
        { status: 400 },
      );
    }

    const amountInUSD = cantidad / rateOrigen;
    const resultado = amountInUSD * rateDestino;

    const transaccion = {
      id: crypto.randomUUID(),
      origen,
      destino,
      cantidad,
      resultado,
      timestamp: new Date().toISOString(),
    };

    const analyticsServiceUrl =
      process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:4001";

    // Fire-and-forget: no bloquea la conversion si el servicio de analitica falla.
    void fetch(`${analyticsServiceUrl}/logs/conversions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Usuario convirtio ${cantidad} ${origen} a ${destino}`,
        ...transaccion,
      }),
    }).catch(() => {
      // Intencionalmente silencioso para no afectar la respuesta al usuario.
    });

    return NextResponse.json({
      resultado,
      transaccion,
    });
  } catch {
    return NextResponse.json(
      { error: "Solicitud invalida" },
      { status: 400 },
    );
  }
}
