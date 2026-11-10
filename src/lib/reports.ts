'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Resident, DocumentRequest, Barangay } from './types';

// -------- UTILITY & HELPER FUNCTIONS --------

export interface BarangayHeaderDetails {
  name: string;
  municipality: string;
  province: string;
  region: string;
  address: string;
  contactNumber: string;
  email: string;
  captainName: string;
  secretaryName: string;
  sealLogoUrl?: string;
}

/**
 * Resolves the dynamic barangay details depending on where residents are registered,
 * checking config, resident record fields, address parsing, and sane defaults.
 */
export function resolveBarangayDetails(
  residents?: Resident[] | null,
  config?: Partial<Barangay> | null,
  officials?: { secretaryName?: string; captainName?: string }
): BarangayHeaderDetails {
  let name = config?.name || '';
  let municipality = config?.municipality || '';
  let province = config?.province || '';
  let address = config?.address || '';
  let contactNumber = config?.contactNumber || '';
  let email = config?.email || '';
  let captainName = officials?.captainName || config?.captainName || '';
  let secretaryName = officials?.secretaryName || '';
  let sealLogoUrl = config?.sealLogoUrl || '';

  // Extract from first resident's data if config is missing specific fields
  if (residents && residents.length > 0) {
    const first = residents[0] as any;
    if (!name && first.barangayName) name = first.barangayName;
    if (!municipality && first.municipality) municipality = first.municipality;
    if (!province && first.province) province = first.province;

    // Check address string (e.g. "Purok 1, Mina de Oro, Bongabong, Oriental Mindoro")
    if (first.address && (!name || !municipality || !province)) {
      const parts = first.address.split(',').map((s: string) => s.trim());
      if (parts.length >= 3) {
        if (!province) province = parts[parts.length - 1];
        if (!municipality) municipality = parts[parts.length - 2];
        if (!name) name = parts[parts.length - 3];
      }
    }
  }

  // Fallbacks and cleanups
  if (!name) name = 'Barangay Mina De Oro';
  const cleanName = name.replace(/^barangay\s+/i, '').trim();
  if (!municipality) municipality = 'Bongabong';
  if (!province) province = 'Oriental Mindoro';
  if (!address) address = `${cleanName}, ${municipality}, ${province}`;
  if (!captainName) captainName = 'Hon. Amado Magtibay';
  if (!secretaryName) secretaryName = 'Barangay Secretary';

  return {
    name: cleanName,
    municipality,
    province,
    region: config?.region || 'Region IV-B (MIMAROPA)',
    address,
    contactNumber: contactNumber || '(043) 283-5000',
    email: email || `office@ibarangay${cleanName.toLowerCase().replace(/\s+/g, '')}.gov.ph`,
    captainName,
    secretaryName,
    sealLogoUrl: sealLogoUrl || '/images/barangay-seal.png',
  };
}

async function getBase64Image(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function computeAge(birthdate?: string): string {
  if (!birthdate) return '—';
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return '—';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : '—';
}

function formatBirthdate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return format(d, 'MMM dd, yyyy');
}

function drawVectorSeal(doc: jsPDF, cx: number, cy: number, barangayName: string) {
  // Outer circle
  doc.setDrawColor(16, 45, 86);
  doc.setLineWidth(0.7);
  doc.circle(cx, cy, 9.5, 'S');

  // Inner circle
  doc.setDrawColor(255, 165, 30);
  doc.setLineWidth(0.35);
  doc.circle(cx, cy, 8, 'S');

  // Center crest
  doc.setFillColor(234, 242, 255);
  doc.circle(cx, cy, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.setTextColor(16, 45, 86);
  doc.text('OFFICIAL', cx, cy - 1.8, { align: 'center' });
  doc.text('SEAL', cx, cy + 1, { align: 'center' });
  doc.setFontSize(3.5);
  doc.setTextColor(255, 165, 30);
  doc.text('★ ★ ★', cx, cy + 3.2, { align: 'center' });
}

function drawOfficialBarangayHeader(
  doc: jsPDF,
  details: BarangayHeaderDetails,
  sealBase64: string | null,
  totalRecords: number,
  registeredVotersCount: number,
  reportTitle = 'OFFICIAL RESIDENT MASTERLIST & REGISTRY'
) {
  const pageWidth = doc.internal.pageSize.width || 297;
  const centerX = pageWidth / 2;

  // 1. Dual Seals
  if (sealBase64) {
    try {
      doc.addImage(sealBase64, 'PNG', 18, 9, 21, 21);
      doc.addImage(sealBase64, 'PNG', pageWidth - 39, 9, 21, 21);
    } catch {
      drawVectorSeal(doc, 28, 19.5, details.name);
      drawVectorSeal(doc, pageWidth - 28, 19.5, details.name);
    }
  } else {
    drawVectorSeal(doc, 28, 19.5, details.name);
    drawVectorSeal(doc, pageWidth - 28, 19.5, details.name);
  }

  // 2. Official Republic Header Texts
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(74, 85, 104);
  doc.text('Republic of the Philippines', centerX, 11, { align: 'center' });
  doc.text(`Province of ${details.province}`, centerX, 14.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`MUNICIPALITY OF ${details.municipality.toUpperCase()}`, centerX, 18.5, { align: 'center' });

  // Barangay Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(16, 45, 86); // #102D56
  doc.text(`BARANGAY ${details.name.toUpperCase()}`, centerX, 24, { align: 'center' });

  // Office
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(36, 107, 222); // #246BDE
  doc.text('OFFICE OF THE SANGGUNIANG BARANGAY', centerX, 28, { align: 'center' });

  // Subtext / Address / Contact
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(113, 128, 150);
  doc.text(
    `${details.address}  •  Contact: ${details.contactNumber}  •  Email: ${details.email}`,
    centerX,
    31.5,
    { align: 'center' }
  );

  // 3. Double Letterhead Lines
  doc.setDrawColor(16, 45, 86);
  doc.setLineWidth(0.8);
  doc.line(14, 34.5, pageWidth - 14, 34.5);

  doc.setDrawColor(255, 165, 30); // Gold accent
  doc.setLineWidth(0.35);
  doc.line(14, 35.6, pageWidth - 14, 35.6);

  // 4. Document Banner Box
  const boxY = 38.5;
  const boxHeight = 10;
  const boxWidth = pageWidth - 28;
  doc.setFillColor(234, 242, 255); // #EAF2FF
  doc.setDrawColor(191, 219, 254); // #BFDBFE
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  // Title inside banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(16, 45, 86);
  doc.text(reportTitle, 19, boxY + 4.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 128, 150);
  doc.text('Official Inhabitant Registry pursuant to Sec. 394(d)(6) of R.A. No. 7160 (Local Government Code)', 19, boxY + 8);

  // Right info inside banner
  const rightX = pageWidth - 19;
  const today = format(new Date(), 'MMMM dd, yyyy • hh:mm a');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(23, 43, 77);
  doc.text(`Date Generated: ${today}`, rightX, boxY + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(36, 107, 222);
  doc.text(
    `Total Residents: ${totalRecords}   |   Voters Recorded: ${registeredVotersCount}`,
    rightX,
    boxY + 8,
    { align: 'right' }
  );
}

const saveAsExcel = (buffer: any, fileName: string) => {
  const data = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePdf = (title: string, head: any[], body: any[], fileName: string) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 45, 86);
  doc.text(title, 14, 15);
  autoTable(doc, {
    head,
    body,
    startY: 22,
    headStyles: { fillColor: [16, 45, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 2 },
  });
  doc.save(fileName);
};

export const generateExcel = (data: any[][], fileName: string) => {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAsExcel(wbout, fileName);
};


// -------- RESIDENT MASTERLIST EXPORT (OFFICIAL PHILIPPINE LGU FORMAT) --------

const masterlistColumns = [
  { header: '#', dataKey: 'index' },
  { header: 'Resident ID', dataKey: 'userId' },
  { header: 'Full Name', dataKey: 'fullName' },
  { header: 'Sex', dataKey: 'sex' },
  { header: 'Age', dataKey: 'age' },
  { header: 'Birthdate', dataKey: 'birthdate' },
  { header: 'Civil Status', dataKey: 'civilStatus' },
  { header: 'Purok / Zone', dataKey: 'purok' },
  { header: 'Household #', dataKey: 'household' },
  { header: 'Voter Status', dataKey: 'voter' },
  { header: 'Contact / Email', dataKey: 'contact' },
];

export const exportResidentMasterlist = async (
  formatType: 'pdf' | 'excel',
  residents: Resident[],
  config?: Partial<Barangay> | null,
  officials?: { secretaryName?: string; captainName?: string }
) => {
  const details = resolveBarangayDetails(residents, config, officials);
  const fileName = `${details.name.replace(/\s+/g, '_')}_Official_Masterlist_${format(new Date(), 'yyyy-MM-dd')}`;

  const votersCount = residents.filter(
    (r) => (r as any).voterStatus === 'Registered'
  ).length;

  if (formatType === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const sealBase64 = await getBase64Image(details.sealLogoUrl || '/images/barangay-seal.png');

    // Draw Official Header
    drawOfficialBarangayHeader(
      doc,
      details,
      sealBase64,
      residents.length,
      votersCount,
      'OFFICIAL RESIDENT MASTERLIST & REGISTRY'
    );

    // Format Rows
    const tableBody = residents.map((r, idx) => {
      const ext = (r as any).extension ? ` ${(r as any).extension}` : '';
      const middle = (r as any).middleName ? ` ${(r as any).middleName[0]}.` : '';
      const fullName = `${r.lastName}, ${r.firstName}${middle}${ext}`;
      const sex = (r as any).sex || '—';
      const age = computeAge(r.birthdate);
      const birthdate = r.birthdate ? formatBirthdate(r.birthdate) : '—';
      const civilStatus = (r as any).civilStatus || '—';
      const purok = r.purok || '—';
      const household = r.householdNumber || '—';
      const voter = (r as any).voterStatus || '—';
      const contact = (r as any).contactNumber || r.email || '—';

      return [
        idx + 1,
        r.userId || r.id.slice(0, 8),
        fullName,
        sex,
        age,
        birthdate,
        civilStatus,
        purok,
        household,
        voter,
        contact,
      ];
    });

    // AutoTable
    autoTable(doc, {
      head: [masterlistColumns.map((c) => c.header)],
      body: tableBody,
      startY: 51,
      margin: { left: 14, right: 14, top: 40, bottom: 18 },
      headStyles: {
        fillColor: [16, 45, 86], // #102D56 Dark Navy
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // #F8FAFC
      },
      styles: {
        fontSize: 7,
        textColor: [23, 43, 77],
        cellPadding: 1.8,
        lineColor: [229, 234, 242],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 24, fontStyle: 'bold', textColor: [36, 107, 222] },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 10, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20 },
        7: { cellWidth: 22 },
        8: { cellWidth: 20, halign: 'center' },
        9: { cellWidth: 24, halign: 'center' },
        10: { cellWidth: 65 },
      },
    });

    // Certification & Signatures on Final Page
    let finalY = (doc as any).lastAutoTable?.finalY || 160;
    if (finalY > 155) {
      doc.addPage();
      finalY = 30;
    } else {
      finalY += 10;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 85, 104);
    doc.text(
      'CERTIFICATION: I hereby certify under official oath that this resident masterlist is a true, faithful, and official record of registered inhabitants of this Barangay as officially recorded and maintained in the Barangay Registry of Inhabitants.',
      148.5,
      finalY,
      { align: 'center', maxWidth: 260 }
    );

    finalY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 128, 150);
    doc.text('Prepared & Certified Correct by:', 35, finalY);
    doc.text('Attested & Approved by:', 195, finalY);

    finalY += 14;

    // Signature lines
    doc.setDrawColor(113, 128, 150);
    doc.setLineWidth(0.3);
    doc.line(35, finalY, 115, finalY);
    doc.line(195, finalY, 275, finalY);

    finalY += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(16, 45, 86);
    doc.text(details.secretaryName.toUpperCase(), 75, finalY, { align: 'center' });
    doc.text(details.captainName.toUpperCase(), 235, finalY, { align: 'center' });

    finalY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(74, 85, 104);
    doc.text('Barangay Secretary', 75, finalY, { align: 'center' });
    doc.text('Punong Barangay / Barangay Captain', 235, finalY, { align: 'center' });

    finalY += 3.5;
    doc.text(`Barangay ${details.name}`, 75, finalY, { align: 'center' });
    doc.text(`Barangay ${details.name}`, 235, finalY, { align: 'center' });

    // Running Footer across all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height || 210;
      const pageWidth = doc.internal.pageSize.width || 297;

      doc.setDrawColor(229, 234, 242);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 128, 150);
      doc.text(
        `iBarangay Digital Management System — Official Masterlist Document  •  Barangay ${details.name}, ${details.municipality}, ${details.province}`,
        14,
        pageHeight - 7
      );
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
    }

    doc.save(`${fileName}.pdf`);
  } else {
    // Official Excel with Barangay Header
    const dataRows = residents.map((r, idx) => {
      const ext = (r as any).extension ? ` ${(r as any).extension}` : '';
      const middle = (r as any).middleName ? ` ${(r as any).middleName[0]}.` : '';
      return [
        idx + 1,
        r.userId || r.id,
        `${r.lastName}, ${r.firstName}${middle}${ext}`,
        (r as any).sex || '',
        computeAge(r.birthdate),
        r.birthdate || '',
        (r as any).civilStatus || '',
        r.purok || '',
        r.address || '',
        r.householdNumber || '',
        (r as any).voterStatus || 'Unknown',
        (r as any).contactNumber || r.email || '',
      ];
    });

    const titleRows = [
      ['REPUBLIC OF THE PHILIPPINES'],
      [`PROVINCE OF ${details.province.toUpperCase()}`],
      [`MUNICIPALITY OF ${details.municipality.toUpperCase()}`],
      [`BARANGAY ${details.name.toUpperCase()} — OFFICIAL RESIDENT MASTERLIST`],
      [`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')} | Total Records: ${residents.length}`],
      [], // blank separator
    ];

    const headers = [
      '#',
      'Resident ID',
      'Full Name',
      'Sex',
      'Age',
      'Birthdate',
      'Civil Status',
      'Purok / Zone',
      'Complete Address',
      'Household Number',
      'Voter Status',
      'Contact / Email',
    ];

    const allRows = [...titleRows, headers, ...dataRows];
    generateExcel(allRows, `${fileName}.xlsx`);
  }
};


// -------- MONTHLY REVENUE REPORT --------

const revenueHeaders = ['Month', 'Total Revenue'];

const formatRevenueData = (requests: DocumentRequest[]) => {
  const monthlyRevenue: { [key: string]: number } = {};

  requests
    .filter((req) => req.status === 'Released' || req.status === 'Payment Verified')
    .forEach((req) => {
      const month = format(new Date(req.requestDate), 'yyyy-MM');
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0;
      }
      monthlyRevenue[month] += req.amount;
    });

  return Object.entries(monthlyRevenue)
    .map(([month, total]) => [month, `₱${total.toFixed(2)}`])
    .sort((a, b) => a[0].localeCompare(b[0]));
};

export const exportMonthlyRevenue = (
  formatType: 'pdf' | 'excel',
  requests: DocumentRequest[],
  config?: Partial<Barangay> | null
) => {
  const details = resolveBarangayDetails(null, config);
  const data = formatRevenueData(requests);
  const fileName = `${details.name.replace(/\s+/g, '_')}_Monthly_Revenue_${format(new Date(), 'yyyy-MM-dd')}`;

  if (formatType === 'pdf') {
    generatePdf(
      `BARANGAY ${details.name.toUpperCase()} — MONTHLY REVENUE REPORT`,
      [revenueHeaders],
      data,
      `${fileName}.pdf`
    );
  } else {
    const titleRows = [
      [`BARANGAY ${details.name.toUpperCase()} — MONTHLY REVENUE REPORT`],
      [`Generated on: ${format(new Date(), 'yyyy-MM-dd')}`],
      [],
    ];
    generateExcel([...titleRows, revenueHeaders, ...data], `${fileName}.xlsx`);
  }
};


// -------- DOCUMENT ISSUANCE REPORT --------

const issuanceHeaders = ['Tracking No.', 'Resident Name', 'Document', 'Date', 'Status', 'Amount'];

const formatIssuanceData = (requests: DocumentRequest[]) => {
  return requests.map((req) => [
    req.trackingNumber,
    req.residentName,
    req.documentType,
    req.requestDate,
    req.status,
    `₱${req.amount.toFixed(2)}`,
  ]);
};

export const exportDocumentIssuance = (
  formatType: 'pdf' | 'excel',
  requests: DocumentRequest[],
  config?: Partial<Barangay> | null
) => {
  const details = resolveBarangayDetails(null, config);
  const data = formatIssuanceData(requests);
  const fileName = `${details.name.replace(/\s+/g, '_')}_Document_Issuance_${format(new Date(), 'yyyy-MM-dd')}`;

  if (formatType === 'pdf') {
    generatePdf(
      `BARANGAY ${details.name.toUpperCase()} — DOCUMENT ISSUANCE REPORT`,
      [issuanceHeaders],
      data,
      `${fileName}.pdf`
    );
  } else {
    const titleRows = [
      [`BARANGAY ${details.name.toUpperCase()} — DOCUMENT ISSUANCE REPORT`],
      [`Generated on: ${format(new Date(), 'yyyy-MM-dd')}`],
      [],
    ];
    generateExcel([...titleRows, issuanceHeaders, ...data], `${fileName}.xlsx`);
  }
};
