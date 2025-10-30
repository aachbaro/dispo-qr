// src/utils/pdf/facturePdf.ts
// -------------------------------------------------------------
// Générateur de PDF pour factures
// -------------------------------------------------------------
//
// Convention française :
// - En-tête centré avec "FACTURE"
// - Bloc Facture N° + Date encadré
// - Émetteur et Client en colonnes (fond gris clair)
// - Tableau prestations avec alternance de couleurs
// - Totaux dans un encadré à droite
// - Mentions légales en petit gris
// - IBAN/BIC en bas à droite
//
// -------------------------------------------------------------

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Facture } from "../../services/factures";

export function generateFacturePdf(facture: Facture, entreprise: any) {
  const doc = new jsPDF();

  // -------------------------
  // HEADER
  // -------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FACTURE", 105, 20, { align: "center" });

  // Bloc facture n° + date
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(200);
  doc.setFillColor("#F5F5F5");
  doc.rect(150, 25, 50, 20, "F");
  doc.text(`N°: ${facture.numero}`, 155, 33);
  doc.text(`Date: ${facture.date_emission}`, 155, 40);

  // -------------------------
  // ÉMETTEUR / CLIENT
  // -------------------------
  doc.setFontSize(12);

  // Émetteur
  doc.setFont("helvetica", "bold");
  doc.text("Émetteur", 25, 58);
  doc.setFont("helvetica", "normal");

  let y = 66;
  doc.text(`${entreprise.nom} ${entreprise.prenom}`, 25, y);
  y += 6;

  if (entreprise.adresse_ligne1) {
    doc.text(entreprise.adresse_ligne1, 25, y);
    y += 6;
  }
  if (entreprise.adresse_ligne2) {
    doc.text(entreprise.adresse_ligne2, 25, y);
    y += 6;
  }
  if (entreprise.code_postal || entreprise.ville) {
    doc.text(
      `${entreprise.code_postal || ""} ${entreprise.ville || ""}`.trim(),
      25,
      y
    );
    y += 6;
  }
  if (entreprise.pays) {
    doc.text(entreprise.pays, 25, y);
    y += 6;
  }

  doc.text(`SIRET : ${entreprise.siret}`, 25, y);
  y += 6;
  if (entreprise.telephone) {
    doc.text(`Tel : ${entreprise.telephone}`, 25, y);
    y += 6;
  }
  doc.text(`Email : ${entreprise.email}`, 25, y);

  // Client
  doc.setFont("helvetica", "bold");
  doc.text("Client", 115, 58);
  doc.setFont("helvetica", "normal");

  y = 66;
  doc.text(facture.client_name, 115, y);
  if (facture.client_address_ligne1) {
    y += 6;
    doc.text(facture.client_address_ligne1, 115, y);
  }
  if (facture.client_address_ligne2) {
    y += 6;
    doc.text(facture.client_address_ligne2, 115, y);
  }
  if (facture.client_code_postal || facture.client_ville) {
    y += 6;
    doc.text(
      `${facture.client_code_postal || ""} ${
        facture.client_ville || ""
      }`.trim(),
      115,
      y
    );
  }
  if (facture.client_pays) {
    y += 6;
    doc.text(facture.client_pays, 115, y);
  }
  if (facture.contact_name) {
    y += 6;
    doc.text(`Contact : ${facture.contact_name}`, 115, y);
  }
  if (facture.contact_email) {
    y += 6;
    doc.text(`Email : ${facture.contact_email}`, 115, y);
  }
  if (facture.contact_phone) {
    y += 6;
    doc.text(`Tel : ${facture.contact_phone}`, 115, y);
  }

  // -------------------------
  // TABLEAU RÉCAPITULATIF
  // -------------------------
  autoTable(doc, {
    startY: 115,
    head: [["Description", "Durée (h)", "Taux (€)", "Total HT (€)"]],
    body: [
      [
        facture.description || "Prestation",
        facture.hours?.toString() || "0",
        facture.rate?.toFixed(2) || "0.00",
        facture.montant_ht.toFixed(2),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: "center" },
    styles: { fontSize: 11 },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  let afterTableY = (doc as any).lastAutoTable.finalY + 15;

  // -------------------------
  // TOTAUX
  // -------------------------
  doc.setDrawColor(200);
  doc.setFillColor("#F5F5F5");
  doc.rect(120, afterTableY, 70, 30, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Montant HT : ${facture.montant_ht.toFixed(2)} €`,
    125,
    afterTableY + 8
  );
  doc.text(
    `TVA (${facture.tva || 0}%) : ${(
      (facture.montant_ht * (facture.tva || 0)) /
      100
    ).toFixed(2)} €`,
    125,
    afterTableY + 15
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    `Total TTC : ${facture.montant_ttc.toFixed(2)} €`,
    125,
    afterTableY + 24
  );

  // -------------------------
  // MENTIONS LÉGALES
  // -------------------------
  let mentionsY = afterTableY + 50;
  doc.setFillColor("#F5F5F5");
  doc.rect(20, mentionsY - 6, 170, 20, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100);
  let lineY = mentionsY;
  if (facture.mention_tva) {
    doc.text(facture.mention_tva, 25, lineY);
    lineY += 5;
  }
  if (facture.conditions_paiement) {
    doc.text(`Conditions : ${facture.conditions_paiement}`, 25, lineY);
    lineY += 5;
  }
  if (facture.penalites_retard) {
    doc.text(`Pénalités : ${facture.penalites_retard}`, 25, lineY);
  }
  doc.setTextColor(0);

  // -------------------------
  // IBAN / BIC
  // -------------------------
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(200);
  doc.setFillColor("#F5F5F5");

  // élargir la boîte : x=20 au lieu de 120, width=170 au lieu de 70
  doc.rect(90, pageHeight - 40, 100, 25, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Coordonnées bancaires :", 95, pageHeight - 32);

  doc.setFont("courier", "normal"); // monospace lisible
  doc.text(`IBAN : ${entreprise.iban}`, 95, pageHeight - 26);
  doc.text(`BIC  : ${entreprise.bic}`, 95, pageHeight - 20);

  // -------------------------
  // SAVE
  // -------------------------
  doc.save(`facture-${facture.numero}.pdf`);
}
