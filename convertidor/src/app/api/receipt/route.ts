import { NextResponse } from "next/server";
import { z } from "zod";

const receiptSchema = z.object({
  id: z.string().min(1),
  origen: z.string().min(3).max(3),
  destino: z.string().min(3).max(3),
  cantidad: z.number().positive(),
  resultado: z.number().positive(),
  timestamp: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json();
    const payload = receiptSchema.parse(rawBody);

    const receiptServiceUrl =
      process.env.RECEIPT_SERVICE_URL ?? "http://localhost:4002";

    const receiptResponse = await fetch(
      `${receiptServiceUrl}/receipts/conversion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!receiptResponse.ok) {
      return NextResponse.json(
        { error: "No se pudo generar el comprobante" },
        { status: 502 },
      );
    }

    const pdfBuffer = new Uint8Array(await receiptResponse.arrayBuffer());

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=comprobante-${payload.id}.pdf`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Solicitud invalida para comprobante" },
      { status: 400 },
    );
  }
}
