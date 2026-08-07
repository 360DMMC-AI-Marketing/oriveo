const SKIP_LINE = /^(patient|date|doctor|physician|ref|range|normal|unit|test|result|collected|received|specimen|lab|page|printed|reported|order|clinic|hospital|account|mrn)\b/i;

const LAB_LINE_RE = /^\s*([A-Za-z][A-Za-z0-9 &'%./\-]{0,60}?)\s+([<>≤≥]?\d+\.?\d*)\s*([A-Za-z0-9%µ/\^_.\-]{0,14})\s*(?:\(?([<>≤≥]?\d+\.?\d*)\s*[-–—]\s*([<>≤≥]?\d+\.?\d*)\)?)?\s*$/;

const PANELS = ["Complete Blood Count", "Comprehensive Metabolic Panel", "CBC", "CMP", "Lipid Panel", "Lipids", "HbA1c", "Hemoglobin A1C", "Thyroid Panel", "Thyroid Function", "TSH", "Urinalysis", "Coagulation", "PT/INR", "Vitamins", "Vitamin D", "Iron Panel", "Ferritin", "BMP", "LFT", "Liver Function", "Renal Panel"];

function cleanName(name) {
  return name.replace(/[:;]$/, "").trim();
}

function cleanNum(v) {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  return s.replace(/^[<>≤≥]+/, "");
}

export function extractLabsFromText(ocrText) {
  if (!ocrText) return null;
  const lines = ocrText.split(/\r?\n/);
  const tests = [];
  let panel = "General";
  let notes = "";

  const lower = ocrText.toLowerCase();
  for (const p of PANELS) {
    if (lower.includes(p.toLowerCase())) {
      panel = p;
      break;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (SKIP_LINE.test(trimmed)) continue;
    const m = trimmed.match(LAB_LINE_RE);
    if (!m) {
      if (trimmed.toLowerCase().includes("reference")) notes += (notes ? " " : "") + trimmed;
      continue;
    }
    const name = cleanName(m[1]);
    if (!name || name.length < 2) continue;
    tests.push({
      name,
      value: m[2],
      unit: (m[3] || "").trim(),
      referenceLow: cleanNum(m[4]),
      referenceHigh: cleanNum(m[5]),
      status: "pending",
    });
    if (tests.length >= 60) break;
  }

  if (!tests.length) return null;
  return { panel, tests, notes };
}

export function extractRxFromText(ocrText) {
  if (!ocrText) return null;
  const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  const full = ocrText;
  let medication = "";
  let dosage = "";
  let frequency = "";
  let instructions = "";

  const doseMatch = full.match(/(\d+\s*(?:mg|g|mcg|mcg|ml|units?|%)|#[12]\s*[a-z]+)/i);
  if (doseMatch) dosage = doseMatch[1];

  const freqMatch = full.match(/\b(nightly|daily|twice\s*daily|three\s*times\s*daily|four\s*times\s*daily|every\s*\d+\s*hours|once\s*daily|\d+\s*x\s*(?:daily|a\s*day)|q\d+h|bid|tid|qhs|qd|prn)\b/i);
  if (freqMatch) frequency = freqMatch[1];

  const qtyMatch = full.match(/(?:qty|quantity|dispense)\s*[:.#]?\s*(\d+)/i);
  const refillMatch = full.match(/(?:refills?|refill)\s*[:.#]?\s*(\d+)/i);

  let medIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (/^[a-z][a-z0-9 -]{2,}$/i.test(lines[i]) && !/^(rx|mrn)\b/i.test(lines[i]) && !/(take|dispense|label|signature|pharmacist|doctor|patient|date|refill|qty)/i.test(l) && !/\d\s*x\s|twice|daily/.test(l)) {
      medIdx = i;
      break;
    }
  }
  if (medIdx >= 0) {
    medication = lines[medIdx].replace(/\d+\s*(mg|g|mcg|ml).*$/i, "").replace(/[;:]$/, "").trim();
    const rest = lines.slice(medIdx, medIdx + 4).join(" ").toLowerCase();
    if (!frequency && /take|\d+\s*(?:tablet|capsule)/.test(rest)) {
      const f = rest.match(/((?:\d+|one|two|three|four)\s*(?:tablets?|capsules?|tabs?|pills?))\s*(?:by\s*mouth|po)?\s*((?:twice|three|four)\s*times\s*daily|nightly|once\s*daily|every\s*\d+\s*hours|\d+\s*x\s*(?:daily|a\s*day)|bid|tid|qd)/i);
      if (f) frequency = `${f[1]} ${f[2]}`.trim();
    }
    const instr = lines.slice(medIdx, medIdx + 4).join(" ");
    if (instr && instr.toLowerCase().includes("take")) {
      instructions = instr.replace(/^[^a-z]*/i, "").replace(/qty.*$/i, "").trim();
      instructions = instructions.replace(/\s+/g, " ").slice(0, 220);
    }
  }

  if (!medication) return null;

  return {
    medication,
    dosage,
    route: "",
    frequency,
    instructions,
    quantity: qtyMatch ? Number(qtyMatch[1]) : null,
    refills: refillMatch ? Number(refillMatch[1]) : 0,
  };
}
