import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Call,
  TEAM_MEMBER_LABELS,
  CALL_SOURCE_LABELS,
  COMPANY_SIZE_LABELS,
  OPERATIONAL_MATURITY_LABELS,
  CONTACT_ROLE_LABELS,
  PROBLEM_TYPE_LABELS,
  AFFECTED_AREA_LABELS,
  IMPACT_LEVEL_LABELS,
  PAYMENT_CAPACITY_LABELS,
  URGENCY_LABELS,
  RISK_SIGNAL_LABELS,
} from '@/types/calls';

// Logo URL
const LOGO_URL = 'https://storage.googleapis.com/cluvi/nuevo_irre-removebg-preview.png';

// Convert image URL to base64
async function getImageBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
}

// Colors
const COLORS = {
  primary: [79, 70, 229] as [number, number, number],      // Indigo-600
  primaryLight: [238, 242, 255] as [number, number, number], // Indigo-50
  green: [34, 197, 94] as [number, number, number],        // Green-500
  greenLight: [220, 252, 231] as [number, number, number], // Green-100
  red: [239, 68, 68] as [number, number, number],          // Red-500
  redLight: [254, 226, 226] as [number, number, number],   // Red-100
  amber: [245, 158, 11] as [number, number, number],       // Amber-500
  amberLight: [254, 243, 199] as [number, number, number], // Amber-100
  gray: [107, 114, 128] as [number, number, number],       // Gray-500
  grayLight: [249, 250, 251] as [number, number, number],  // Gray-50
  dark: [17, 24, 39] as [number, number, number],          // Gray-900
  white: [255, 255, 255] as [number, number, number],
};

export async function generateCallPDF(call: Call) {
  const doc = new jsPDF();
  const q = call.qualification;
  const isQualified = q?.qualification_decision === 'aplica_fase_0';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  let yPos = 0;

  // Load logo
  const logoBase64 = await getImageBase64(LOGO_URL);

  // ============================================
  // COVER PAGE
  // ============================================

  // Background gradient effect (simulated with rectangles)
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 100, 'F');

  // Decorative circles
  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.1 }));
  doc.circle(170, 20, 40, 'F');
  doc.circle(190, 60, 25, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 15, 50, 20);
    } catch (e) {
      // If logo fails, show text
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('IRRELEVANT', margin, 30);
    }
  }

  // Document type badge
  doc.setFillColor(...COLORS.white);
  doc.roundedRect(pageWidth - margin - 45, 20, 45, 10, 2, 2, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE CIERRE', pageWidth - margin - 22.5, 26.5, { align: 'center' });

  // Main title area
  yPos = 55;
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('REPORTE DE CALIFICACION', margin, yPos);

  yPos += 12;
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const companyName = call.company_name || 'Sin empresa';
  const companyLines = doc.splitTextToSize(companyName, contentWidth);
  doc.text(companyLines[0], margin, yPos);
  if (companyLines.length > 1) {
    doc.setFontSize(18);
    doc.text(companyLines[1], margin, yPos + 10);
  }

  // Decision badge - positioned below the header
  yPos = 115;
  const badgeWidth = 70;
  const badgeHeight = 28;
  const badgeX = (pageWidth - badgeWidth) / 2;

  // Badge shadow
  doc.setFillColor(0, 0, 0);
  doc.setGState(new doc.GState({ opacity: 0.1 }));
  doc.roundedRect(badgeX + 2, yPos + 2, badgeWidth, badgeHeight, 4, 4, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Badge background
  doc.setFillColor(...(isQualified ? COLORS.green : COLORS.red));
  doc.roundedRect(badgeX, yPos, badgeWidth, badgeHeight, 4, 4, 'F');

  // Badge text
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(isQualified ? 'APLICA FASE 0' : 'NO APLICA', pageWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('DECISION FINAL', pageWidth / 2, yPos + 20, { align: 'center' });

  // Info cards row
  yPos = 155;
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 35;

  // Card 1: Date
  doc.setFillColor(...COLORS.grayLight);
  doc.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('FECHA DE LLAMADA', margin + 5, yPos + 10);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(call.scheduled_at), "d MMM yyyy", { locale: es }), margin + 5, yPos + 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(call.scheduled_at), "HH:mm 'hrs'"), margin + 5, yPos + 28);

  // Card 2: Duration
  doc.setFillColor(...COLORS.grayLight);
  doc.roundedRect(margin + cardWidth + 5, yPos, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('DURACION', margin + cardWidth + 10, yPos + 10);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${call.duration_minutes || 30} minutos`, margin + cardWidth + 10, yPos + 20);

  // Card 3: Responsible
  doc.setFillColor(...COLORS.grayLight);
  doc.roundedRect(margin + (cardWidth + 5) * 2, yPos, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('RESPONSABLE', margin + (cardWidth + 5) * 2 + 5, yPos + 10);
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(TEAM_MEMBER_LABELS[call.team_member].split(' ')[0], margin + (cardWidth + 5) * 2 + 5, yPos + 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(TEAM_MEMBER_LABELS[call.team_member].split(' ').slice(1).join(' '), margin + (cardWidth + 5) * 2 + 5, yPos + 28);

  // Contact info section
  yPos = 200;
  if (call.contact_name || call.contact_email || call.contact_phone) {
    doc.setFillColor(...COLORS.primaryLight);
    doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACTO', margin + 5, yPos + 8);

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let contactText = call.contact_name || '';
    if (call.contact_email) contactText += `  |  ${call.contact_email}`;
    if (call.contact_phone) contactText += `  |  ${call.contact_phone}`;
    doc.text(contactText, margin + 5, yPos + 20);

    yPos += 40;
  }

  // Source badge if exists
  if (call.source) {
    doc.setFillColor(...COLORS.grayLight);
    doc.roundedRect(margin, yPos, 60, 15, 2, 2, 'F');
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(7);
    doc.text('FUENTE', margin + 5, yPos + 6);
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(CALL_SOURCE_LABELS[call.source], margin + 5, yPos + 12);
  }

  // ============================================
  // KEY INSIGHTS SECTION (if available)
  // ============================================
  if (call.key_notes && call.key_notes.length > 0) {
    yPos = 250;

    // Section header
    doc.setFillColor(...COLORS.amber);
    doc.roundedRect(margin, yPos, 4, 20, 1, 1, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Insights', margin + 10, yPos + 7);
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Puntos clave de la conversacion', margin + 10, yPos + 15);

    yPos += 25;

    call.key_notes.forEach((note, index) => {
      if (yPos > 275) return; // Limit on first page

      doc.setFillColor(...COLORS.amberLight);
      const noteLines = doc.splitTextToSize(note, contentWidth - 20);
      const noteHeight = Math.max(15, noteLines.length * 5 + 8);
      doc.roundedRect(margin, yPos, contentWidth, noteHeight, 2, 2, 'F');

      // Bullet point
      doc.setFillColor(...COLORS.amber);
      doc.circle(margin + 6, yPos + 7, 2, 'F');

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(noteLines, margin + 12, yPos + 8);

      yPos += noteHeight + 3;
    });
  }

  // ============================================
  // PAGE 2 - QUALIFICATION DETAILS
  // ============================================
  doc.addPage();
  yPos = 20;

  // Page header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 25, 'F');

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 5, 30, 12);
    } catch (e) {}
  }

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMULARIO DE CALIFICACION', pageWidth - margin, 14, { align: 'right' });

  yPos = 35;

  if (!q) {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(12);
    doc.text('Esta llamada no tiene formulario de calificacion completado.', pageWidth / 2, 100, { align: 'center' });
  } else {
    // Helper function for section headers
    const drawSectionHeader = (title: string, number: string, y: number) => {
      doc.setFillColor(...COLORS.primaryLight);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');

      // Number circle
      doc.setFillColor(...COLORS.primary);
      doc.circle(margin + 8, y + 6, 5, 'F');
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(number, margin + 8, y + 7.5, { align: 'center' });

      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 18, y + 7.5);

      return y + 16;
    };

    // Helper function for key-value rows
    const drawInfoRow = (label: string, value: string, y: number, highlight?: 'green' | 'red' | 'amber') => {
      if (highlight) {
        const bgColor = highlight === 'green' ? COLORS.greenLight : highlight === 'red' ? COLORS.redLight : COLORS.amberLight;
        doc.setFillColor(...bgColor);
        doc.roundedRect(margin + 60, y - 4, contentWidth - 60, 7, 1, 1, 'F');
      }

      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin + 2, y);

      doc.setTextColor(...COLORS.dark);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + 62, y);

      return y + 8;
    };

    // SECTION 1: Contexto del Cliente
    yPos = drawSectionHeader('Contexto del Cliente', '1', yPos);
    yPos = drawInfoRow('Industria', q.industry || '-', yPos);
    yPos = drawInfoRow('Tamano', q.company_size ? COMPANY_SIZE_LABELS[q.company_size] : '-', yPos);
    yPos = drawInfoRow('Madurez Operativa', q.operational_maturity ? OPERATIONAL_MATURITY_LABELS[q.operational_maturity] : '-', yPos);
    yPos = drawInfoRow('Rol del Contacto', q.contact_role ? CONTACT_ROLE_LABELS[q.contact_role] : '-', yPos);
    yPos += 5;

    // SECTION 2: Problema Declarado
    yPos = drawSectionHeader('Problema Declarado', '2', yPos);
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const problemLines = doc.splitTextToSize(`"${q.client_problem_description || 'No registrado'}"`, contentWidth - 10);
    doc.text(problemLines, margin + 5, yPos);
    yPos += problemLines.length * 5 + 8;

    // SECTION 3: Problema Real
    yPos = drawSectionHeader('Problema Real (Criterio Irrelevant)', '3', yPos);
    yPos = drawInfoRow('Tipo', q.problem_type ? PROBLEM_TYPE_LABELS[q.problem_type] : '-', yPos, q.problem_type === 'causa' ? 'green' : undefined);
    yPos = drawInfoRow('Area Afectada', q.affected_area ? AFFECTED_AREA_LABELS[q.affected_area] : '-', yPos);
    if (q.real_problem_description) {
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const realProblemLines = doc.splitTextToSize(q.real_problem_description, contentWidth - 10);
      doc.text(realProblemLines, margin + 5, yPos);
      yPos += realProblemLines.length * 5;
    }
    yPos += 8;

    // Check if we need new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 35;
      // Mini header
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', margin, 5, 30, 12); } catch (e) {}
      }
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('FORMULARIO DE CALIFICACION (cont.)', pageWidth - margin, 14, { align: 'right' });
    }

    // SECTION 4: Impacto
    yPos = drawSectionHeader('Impacto en el Negocio', '4', yPos);

    // Impact grid
    const impactBoxWidth = (contentWidth - 10) / 3;
    const drawImpactBox = (label: string, value: boolean, x: number) => {
      doc.setFillColor(...(value ? COLORS.greenLight : COLORS.redLight));
      doc.roundedRect(x, yPos, impactBoxWidth, 18, 2, 2, 'F');
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(7);
      doc.text(label, x + impactBoxWidth / 2, yPos + 6, { align: 'center' });
      doc.setTextColor(...(value ? COLORS.green : COLORS.red));
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(value ? 'SI' : 'NO', x + impactBoxWidth / 2, yPos + 14, { align: 'center' });
    };

    drawImpactBox('REVENUE', q.impacts_revenue === 'si', margin);
    drawImpactBox('CONTROL', q.impacts_control === 'si', margin + impactBoxWidth + 5);
    drawImpactBox('CONTINUIDAD', q.impacts_continuity === 'si', margin + (impactBoxWidth + 5) * 2);
    yPos += 22;

    const impactLevel = q.global_impact_level;
    const impactColor = impactLevel === 'alto' ? 'green' : impactLevel === 'medio' ? 'amber' : 'red';
    yPos = drawInfoRow('Nivel de Impacto Global', impactLevel ? IMPACT_LEVEL_LABELS[impactLevel].toUpperCase() : '-', yPos, impactColor as any);
    yPos += 5;

    // SECTION 5: Decisor
    yPos = drawSectionHeader('Decisor y Skin in the Game', '5', yPos);
    yPos = drawInfoRow('Quien Decide', q.final_decision_maker || '-', yPos);
    yPos = drawInfoRow('Quien Paga', q.who_pays || '-', yPos);
    yPos = drawInfoRow('Quien Sufre', q.who_suffers_problem || '-', yPos);
    yPos = drawInfoRow('Alineados', q.stakeholders_aligned ? 'SI' : 'NO (RIESGO)', yPos, q.stakeholders_aligned ? 'green' : 'red');
    yPos += 5;

    // Check if we need new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 35;
      doc.setFillColor(...COLORS.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');
      if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', margin, 5, 30, 12); } catch (e) {}
      }
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('FORMULARIO DE CALIFICACION (cont.)', pageWidth - margin, 14, { align: 'right' });
    }

    // SECTION 6: Capacidad de Pago
    yPos = drawSectionHeader('Capacidad de Pago y Prioridad', '6', yPos);
    yPos = drawInfoRow('Capacidad de Pago', q.payment_capacity ? PAYMENT_CAPACITY_LABELS[q.payment_capacity] : '-', yPos);
    const urgencyColor = q.urgency === 'hoy' ? 'green' : q.urgency === 'proximo_trimestre' ? 'amber' : 'red';
    yPos = drawInfoRow('Urgencia', q.urgency ? URGENCY_LABELS[q.urgency] : '-', yPos, urgencyColor as any);
    yPos = drawInfoRow('Intento Antes', q.tried_before === 'si' ? 'SI' : 'NO', yPos);
    yPos += 5;

    // SECTION 7: Riesgos
    yPos = drawSectionHeader('Senales de Riesgo', '7', yPos);
    if (q.risk_signals && q.risk_signals.length > 0) {
      doc.setFillColor(...COLORS.redLight);
      const riskHeight = Math.min(q.risk_signals.length * 7 + 6, 35);
      doc.roundedRect(margin, yPos, contentWidth, riskHeight, 2, 2, 'F');

      doc.setTextColor(...COLORS.red);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      q.risk_signals.forEach((signal, idx) => {
        if (idx < 4) {
          doc.text(`• ${RISK_SIGNAL_LABELS[signal]}`, margin + 5, yPos + 6 + idx * 7);
        }
      });
      yPos += riskHeight + 3;
    } else {
      doc.setTextColor(...COLORS.green);
      doc.setFontSize(9);
      doc.text('No se detectaron senales de riesgo', margin + 5, yPos);
      yPos += 8;
    }
    yPos += 5;

    // ============================================
    // FINAL DECISION BOX
    // ============================================
    // Decision box with shadow effect
    doc.setFillColor(0, 0, 0);
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.roundedRect(margin + 3, yPos + 3, contentWidth, 45, 4, 4, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setFillColor(...(isQualified ? COLORS.green : COLORS.red));
    doc.roundedRect(margin, yPos, contentWidth, 45, 4, 4, 'F');

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DECISION FINAL', margin + 10, yPos + 12);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(isQualified ? 'APLICA PARA FASE 0' : 'NO APLICA', margin + 10, yPos + 28);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setGState(new doc.GState({ opacity: 0.9 }));
    doc.text(isQualified ? 'El lead cumple los criterios de calificacion' : 'El lead no cumple los criterios', margin + 10, yPos + 38);
    doc.setGState(new doc.GState({ opacity: 1 }));

    yPos += 55;

    // Justification
    if (q.decision_justification) {
      doc.setFillColor(...COLORS.grayLight);
      const justLines = doc.splitTextToSize(q.decision_justification, contentWidth - 20);
      const justHeight = justLines.length * 5 + 15;
      doc.roundedRect(margin, yPos, contentWidth, justHeight, 3, 3, 'F');

      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('JUSTIFICACION', margin + 10, yPos + 8);

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(justLines, margin + 10, yPos + 16);
    }
  }

  // ============================================
  // FOOTER on all pages
  // ============================================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...COLORS.grayLight);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generado el ${format(new Date(), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Save the PDF
  const fileName = `Informe_${(call.company_name || 'Llamada').replace(/\s+/g, '_')}_${format(new Date(call.scheduled_at), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
