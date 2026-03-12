import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const receiptSchema = z.object({
  id: z.string().min(1),
  origen: z.string().min(3).max(3),
  destino: z.string().min(3).max(3),
  cantidad: z.number().positive(),
  resultado: z.number().positive(),
  timestamp: z.string().min(1),
});

type ReceiptPayload = z.infer<typeof receiptSchema>;

const generateReceiptPdf = async (payload: ReceiptPayload) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { height } = page.getSize();
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let cursorY = height - 72;

  page.drawText("Comprobante de Conversion", {
    x: 72,
    y: cursorY,
    size: 22,
    font: titleFont,
  });

  cursorY -= 44;

  const lines = [
    `ID de transaccion: ${payload.id}`,
    `Fecha: ${new Date(payload.timestamp).toLocaleString("es-MX")}`,
    "",
    "Detalle",
    `Moneda origen: ${payload.origen}`,
    `Moneda destino: ${payload.destino}`,
    `Cantidad: ${payload.cantidad.toFixed(2)}`,
    `Resultado: ${payload.resultado.toFixed(2)}`,
  ];

  lines.forEach((line) => {
    const isSectionTitle = line === "Detalle";

    if (line.length > 0) {
      page.drawText(line, {
        x: 72,
        y: cursorY,
        size: isSectionTitle ? 14 : 12,
        font: isSectionTitle ? titleFont : bodyFont,
      });
    }

    cursorY -= isSectionTitle ? 28 : 20;
  });

  page.drawText(
    "Este documento fue generado automaticamente por la aplicacion.",
    {
      x: 72,
      y: cursorY - 20,
      size: 10,
      font: bodyFont,
      color: rgb(0.4, 0.4, 0.4),
    },
  );

  return Buffer.from(await pdfDoc.save());
};

export async function POST(req: Request) {
  try {
    const rawBody: unknown = await req.json();
    const payload = receiptSchema.parse(rawBody);

    const pdfBuffer = await generateReceiptPdf(payload);
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=comprobante-${payload.id}.pdf`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Solicitud invalida para comprobante" },
        { status: 400 },
      );
    }

    console.error("Error generando comprobante PDF", error);

    return NextResponse.json(
      { error: "No se pudo generar el comprobante" },
      { status: 500 },
    );
  }
}
