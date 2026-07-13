import { addDocument, removeDocument } from "./knowledgeBase.js";

const SCRAPED_DOC_ID = "practice-website";
const FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const COMMON_PAGES = [
  { path: "", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/about-us", label: "About Us" },
  { path: "/services", label: "Services" },
  { path: "/specialties", label: "Specialties" },
  { path: "/providers", label: "Providers" },
  { path: "/doctors", label: "Doctors" },
  { path: "/team", label: "Team" },
  { path: "/contact", label: "Contact" },
  { path: "/locations", label: "Locations" },
  { path: "/insurance", label: "Insurance" },
  { path: "/patient-info", label: "Patient Info" },
  { path: "/faq", label: "FAQ" },
];

function extractPhone(html) {
  // 1 — tel: links (most reliable)
  const telMatch = html.match(/tel:(\+?\d[\d\s\-().]+)/i);
  if (telMatch) {
    const num = telMatch[1].trim();
    if (num.replace(/\D/g, "").length > 6) return num;
  }
  // 2 — JS variable declarations: var PHONE = "..."
  const varMatch = html.match(/(?:phone|PHONE|Phone|TELEPHONE|telephone|CONTACT_PHONE|support_phone)\s*[=:]\s*['"]([^'"]{7,20})['"]/i);
  if (varMatch) {
    const num = varMatch[1].trim();
    if (num.replace(/\D/g, "").length > 6) return num;
  }
  // 3 — Near "call us / contact us / phone" keywords
  const keywordPhone = html.match(/(?:call\s+us|contact\s+us|phone|telephone|tel)[:\s]*\(?\d[\d\s\-().]{7,15}/i);
  if (keywordPhone) {
    const num = keywordPhone[0].replace(/^[^0-9(+]+/, "").trim();
    if (num.replace(/\D/g, "").length > 6) return num;
  }
  // 4 — Generic regex, filtered to avoid CSS/svg garbage
  const generic = html.match(/(?:\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}|\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/);
  if (generic) {
    const num = generic[0].trim();
    if (num.replace(/\D/g, "").length > 6 && !/^[\d\s]{1,6}$/.test(num)) return num;
  }
  return null;
}

export async function scrapeClinicWebsite(baseUrl) {
  if (!baseUrl) {
    throw new Error("No website URL provided");
  }

  let normalizedUrl = baseUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  const urlObj = new URL(normalizedUrl);
  const origin = urlObj.origin;

  removeDocument(SCRAPED_DOC_ID);

  const results = [];
  let allContent = "";
  const visited = new Set();
  let detectedName = "";
  let detectedPhone = "";
  let detectedAddress = "";

  async function fetchAndProcessPage(pageUrl, label) {
    if (visited.has(pageUrl)) return;
    visited.add(pageUrl);
    try {
      const response = await fetchWithTimeout(pageUrl);
      if (!response.ok) {
        results.push({ page: pageUrl, status: response.status, error: `HTTP ${response.status}` });
        return null;
      }
      const html = await response.text();
      if (html.length < 50) {
        results.push({ page: pageUrl, status: "skipped", error: "Empty page" });
        return null;
      }
      const text = extractText(html);
      const cleaned = text.slice(0, 4000).trim();
      if (cleaned.length < 20) {
        results.push({ page: pageUrl, status: "skipped", error: "No meaningful text" });
        return null;
      }
      const pageTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = pageTitleMatch ? pageTitleMatch[1].trim() : label;
      addDocument(SCRAPED_DOC_ID, `${pageTitle} — ${label}`, cleaned, { source: pageUrl, pageType: label });
      allContent += cleaned + "\n\n";
      results.push({ page: pageUrl, status: "ok", chars: cleaned.length });
      return { html, cleaned };
    } catch (err) {
      const errMsg = err.name === "AbortError" ? "Timeout" : err.message;
      results.push({ page: pageUrl, status: "error", error: errMsg });
      return null;
    }
  }

  // First fetch homepage to extract name + phone
  const homepageResult = await fetchAndProcessPage(origin, "Home");
  if (homepageResult) {
    const hpHtml = homepageResult.html;

    // 0 — JSON-LD application name / site name
    const jsonLdName = hpHtml.match(/"name"\s*:\s*"([^"]{4,80})"/i);
    if (jsonLdName) detectedName = jsonLdName[1].trim();
    if (!detectedName || detectedName.length < 3) {
      const ogSiteMatch = hpHtml.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
      if (ogSiteMatch) detectedName = ogSiteMatch[1].trim();
    }
    // 1 — <title> with smarter stripping
    if (!detectedName || detectedName.length < 3) {
      const titleMatch = hpHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        const raw = titleMatch[1].trim();
        const parts = raw.split(/\s*[|–—-]\s*/).filter(Boolean);
        // Pick the longest segment (usually the full practice name, not the slogan/tagline)
        parts.sort((a, b) => b.length - a.length);
        detectedName = parts[0].trim();
      }
    }
    if (!detectedName || detectedName.length < 3) {
      const h1Match = hpHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) detectedName = h1Match[1].trim();
    }
    if (!detectedName || detectedName.length < 3) {
      const ogTitleMatch = hpHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      if (ogTitleMatch) detectedName = ogTitleMatch[1].trim();
    }
    if (!detectedName || detectedName.length < 3) {
      const descMatch = hpHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,200})["']/i);
      if (descMatch) {
        const desc = descMatch[1].replace(/\s*\|.*$/, "").replace(/\s*[-–].*$/, "").replace(/provides?.*$/i, "").replace(/We\s+|Our\s+/i, "").trim();
        if (desc.length > 5 && desc.length < 80) detectedName = desc;
      }
    }

    // Phone detection: structured patterns first, then regex with noise filtering
    detectedPhone = extractPhone(hpHtml);
    // Helper: extract clean plain text from HTML (strips style/script blocks)
    const cleanHtml = hpHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "");
    const plainText = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Strategy 1: JSON-LD / microdata with explicit address
    const jsonLdMatch = hpHtml.match(/"streetAddress"\s*:\s*"([^"]+)"/i);
    if (jsonLdMatch) {
      const addr = jsonLdMatch[1].trim();
      if (addr.length > 5) detectedAddress = addr;
    }

    // Strategy 2: "Adresse / Address / Location / Nous trouver / Contact" label + nearby text
    if (!detectedAddress) {
      const labelRegex = /(?:adresse\s*(?::|»|–|—|>)?\s*|address\s*:?\s*|(?:find\s+)?(?:us|our)\s*(?:at|location)\s*:?\s*|nous\s+(?:trouver|situer|joindre)\s*:?\s*|rendez-vous\s*(?::|»)?\s*|contact\s*:?\s*|visit\s+us\s*(?::|at)?\s*|localisation\s*:?\s*|situé(?:e)?\s+(?:au|à\s+l[ae']?|dans)\s+)\s*(?:<[^>]+>)*\s*([A-Za-zÀ-ÿ0-9][^<>{}\n]{8,120}?)(?:\s*(?:<br\s*\/?>|<\/p>|\n|\.\s|\.$))/gi;
      let match;
      while ((match = labelRegex.exec(hpHtml)) !== null) {
        const candidate = match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (candidate.length > 10 && candidate.length < 150 && /\d/.test(candidate)) {
          detectedAddress = candidate;
          break;
        }
      }
    }

    // Strategy 3: Look for address-like patterns in plain text (don't split by commas)
    if (!detectedAddress) {
      const blocks = plainText.split(/[.!?\n]{2,}/).filter(b => b.trim().length > 0);
      for (const block of blocks) {
        const trimmed = block.trim();
        if (trimmed.length > 15 && trimmed.length < 200 && /\d{2,}/.test(trimmed)) {
          const hasStreetKW = /(?:rue|street|avenue|av\.|boulevard|blvd|road|rd\.|drive|dr\.|place|pl\.|chemin|allée|route|rte\.|calle|rua|praca?|travessa|b\.?\s*\d|n\.?\s*\d|km\s+\d|immeuble|résidence|appartement|apt|bâtiment|etage|étage|lot\s+\d|villa|n°|nº|number|suite|bureau|local|magasin|centre|clinique|hôpital|cabinet|consultation|rendez-vous|rdv|zf|hay|av|bd|rue\s+\d)/i.test(trimmed) || /\d{4,5}\s*(?:[A-Za-zÀ-ÿ]{2,})?(?:\s*-?\s*\d{3,4})?$/.test(trimmed);
          if (hasStreetKW) {
            detectedAddress = trimmed;
            break;
          }
        }
      }
    }

    // Strategy 4: Generic fallback — any segment starting with a number followed by a street keyword
    if (!detectedAddress) {
      const lines = plainText.split(/[,\n]{1}/).map(l => l.trim()).filter(l => l.length > 0);
      for (const line of lines) {
        if (line.length < 15 || line.length > 150) continue;
        if (!/\d{2,}/.test(line) || !/[A-Za-z]{3,}/.test(line)) continue;
        if (/=>|===|!==|\+\+|--|\(|\)|\{|\}|\[|\]|var |const |let |function|console\.|return |if \(|while |for \(|new |import |export |class |throw |this\.|\.push|\.map|\.filter|\.then|await |async |\.catch|Error|Promise|\.js |=>|px;|rgba|var\(--/i.test(line)) continue;
        if (/^\d{4,5}\s*[)\];]/.test(line)) continue;
        if (/\.\w+\(/.test(line)) continue;
        detectedAddress = line;
        break;
      }
    }
  }

  // Fetch remaining pages
  for (const page of COMMON_PAGES) {
    if (page.path === "") continue;
    await fetchAndProcessPage(origin + page.path, page.label);
  }

  const successful = results.filter((r) => r.status === "ok").length;

  return {
    url: origin,
    pagesAttempted: COMMON_PAGES.length,
    pagesScraped: successful,
    detectedName: detectedName || null,
    detectedPhone: detectedPhone || null,
    detectedAddress: detectedAddress || null,
    results,
    totalChars: allContent.length,
  };
}

export function clearScrapedData() {
  removeDocument(SCRAPED_DOC_ID);
}
