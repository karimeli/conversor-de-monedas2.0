const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "receipt-service" });
});

app.post("/receipts/conversion", (req, res) => {
  const { id, origen, destino, cantidad, resultado, timestamp } = req.body || {};

  if (!id || !origen || !destino || !cantidad || !resultado || !timestamp) {
    return res.status(400).json({ error: "Payload incompleto" });
  }

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=comprobante-${id}.pdf`);

  doc.fontSize(22).text("Comprobante de Conversion", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`ID de transaccion: ${id}`);
  doc.text(`Fecha: ${new Date(timestamp).toLocaleString("es-MX")}`);
  doc.moveDown();

  doc.fontSize(14).text("Detalle");
  doc.moveDown(0.5);

  doc.fontSize(12).text(`Moneda origen: ${origen}`);
  doc.text(`Moneda destino: ${destino}`);
  doc.text(`Cantidad: ${Number(cantidad).toFixed(2)}`);
  doc.text(`Resultado: ${Number(resultado).toFixed(2)}`);

  doc.moveDown(2);
  doc.fontSize(10).fillColor("#666").text("Este documento fue generado automaticamente por el microservicio de comprobantes.", {
    align: "center",
  });

  doc.pipe(res);
  doc.end();
});

app.listen(PORT, () => {
  console.log(`Receipt service escuchando en http://localhost:${PORT}`);
});
