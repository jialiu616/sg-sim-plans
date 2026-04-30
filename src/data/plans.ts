export interface SimPlan {
  id: number;
  provider: string;
  network: string;
  planName: string;
  data: string;
  dataSortValue: number;
  networkType: "4G" | "5G" | "5G+";
  callMinutes: string;
  sms: string;
  roaming: string;
  price: number;
  esim: boolean;
  notes: string;
  /** 'new' = newly added plan, 'updated' = existing plan with changes */
  status?: "new" | "updated";
  /** ISO date string when status was set (badges auto-expire after 30 days) */
  statusDate?: string;
}

/** Check if a plan's status badge should still be shown (within 30 days) */
export function isPlanStatusActive(plan: SimPlan): boolean {
  if (!plan.status || !plan.statusDate) return false;
  const diffMs = Date.now() - new Date(plan.statusDate).getTime();
  return diffMs < 30 * 24 * 60 * 60 * 1000;
}

export const COUNTRY_MAP: Record<string, string> = {
  MY: "Malaysia",
  ID: "Indonesia",
  TH: "Thailand",
  CN: "China",
  HK: "Hong Kong",
  MO: "Macau",
  TW: "Taiwan",
  JP: "Japan",
  KR: "South Korea",
  IN: "India",
  PH: "Philippines",
  VN: "Vietnam",
  AU: "Australia",
  NZ: "New Zealand",
  BD: "Bangladesh",
  KH: "Cambodia",
  LA: "Laos",
  MM: "Myanmar",
  LK: "Sri Lanka",
  BN: "Brunei",
  US: "United States",
  UK: "United Kingdom",
};

export const PROVIDER_URLS: Record<string, string> = {
  "Zero1": "https://www.zero1.sg",
  "CMLink": "https://www.cmlink.com/sg/",
  "VIVIFI": "https://www.vivifi.me",
  "Maxx": "https://maxx.sg",
  "MyRepublic": "https://myrepublic.net/sg/mobile/",
  "eight": "https://www.eight.com.sg",
  "Circles.Life": "https://www.circles.life/sg/",
  "SIMBA": "https://www.simba.sg",
  "GOMO": "https://www.gomo.sg",
  "giga!": "https://www.giga.com.sg",
  "redONE": "https://redonemobile.com.sg",
  "M1": "https://www.m1.com.sg",
  "Singtel": "https://www.singtel.com",
  "StarHub": "https://www.starhub.com",
  "ZYM Mobile": "https://zym.sg",
  "CUniq": "https://www.cuniq.sg",
};

const REVERSE_COUNTRY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_MAP).map(([code, name]) => [name.toLowerCase(), code])
);
// Add alias not auto-generated from COUNTRY_MAP
REVERSE_COUNTRY_MAP["mainland china"] = "CN";

/** Standard APAC country codes used by Singapore telcos */
const APAC_COUNTRIES = ["MY", "ID", "TH", "VN", "PH", "TW", "HK", "CN", "KR", "JP", "AU", "IN", "BD", "NZ", "LK", "MO", "KH", "LA", "MM", "BN"];

/** Extract country codes from roaming text */
export function extractRoamingCountries(roaming: string): string[] {
  if (!roaming || roaming === "-") return [];
  const found = new Set<string>();
  const codes = Object.keys(COUNTRY_MAP).filter(c => c !== "SG");

  // Match 2-letter uppercase codes
  const codeMatches = roaming.matchAll(/\b([A-Z]{2})\b/g);
  for (const m of codeMatches) {
    if (codes.includes(m[1])) found.add(m[1]);
  }

  // Match full country names
  const lower = roaming.toLowerCase();
  for (const [name, code] of Object.entries(REVERSE_COUNTRY_MAP)) {
    if (code !== "SG" && lower.includes(name)) found.add(code);
  }

  // Only expand vague regional terms when no explicit countries were found
  if (found.size === 0) {
    if (/\bglobal\b|\bworldwide\b|\binternational\b/i.test(roaming)) {
      for (const code of codes) found.add(code);
    } else if (/\bAPAC\b|\bAsia\b|\bregional\b/i.test(roaming)) {
      for (const code of APAC_COUNTRIES) {
        if (code !== "SG") found.add(code);
      }
    }
  }

  return [...found].sort();
}

/** Expand country codes in roaming text to full names for display */
export function expandRoamingText(roaming: string): string {
  if (!roaming || roaming === "-") return roaming;
  // Replace 2-letter codes in parenthetical lists like (MY, ID, TH)
  return roaming.replace(/\(([A-Z]{2}(?:,\s*[A-Z]{2})*)\)/g, (_match, codes: string) => {
    const expanded = codes.split(/,\s*/).map((code: string) =>
      COUNTRY_MAP[code] || code
    );
    return `(${expanded.join(", ")})`;
  });
}

/** Extract total roaming data in GB from roaming text */
export function extractRoamingGB(roaming: string): number {
  if (!roaming || roaming === "-") return 0;

  // Check each segment for "Unlimited" referring to data (not calls/SMS/mins)
  const segments = roaming.split("; ");
  for (const seg of segments) {
    if (/unlimited/i.test(seg) && !/calls|SMS|mins/i.test(seg)) {
      return Infinity;
    }
  }

  // Sum all numeric GB/TB values
  const matches = [...roaming.matchAll(/(\d[\d,]*)\s*(GB|TB)/gi)];
  if (matches.length === 0) {
    // No numeric values but text implies roaming exists
    if (/roaming/i.test(roaming)) return Infinity;
    return 0;
  }

  let total = 0;
  for (const m of matches) {
    const num = parseInt(m[1].replace(/,/g, ""), 10);
    total += m[2].toUpperCase() === "TB" ? num * 1000 : num;
  }
  return total;
}

export const LAST_UPDATED = "2026-04-30";

export const plans: SimPlan[] = [
  // ========== Zero1 (Network: Singtel) ==========
  {
    id: 1,
    provider: "Zero1",
    network: "Singtel",
    planName: "Starter Prime 4G",
    data: "200GB",
    dataSortValue: 200,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "100GB Malaysia (one-time, 365 days); 3GB RoamAP (6 APAC destinations)",
    price: 7.06,
    esim: true,
    notes: ""
  },
  {
    id: 2,
    provider: "Zero1",
    network: "Singtel",
    planName: "Jumbo Value 5G",
    data: "201GB",
    dataSortValue: 201,
    networkType: "5G",
    callMinutes: "301 mins",
    sms: "101 SMS",
    roaming: "-",
    price: 7.70,
    esim: true,
    notes: "Includes 5G access"
  },
  {
    id: 3,
    provider: "Zero1",
    network: "Singtel",
    planName: "Streamo Bold 4G",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "600GB Malaysia & Indonesia (one-time, 365 days); 12GB RoamAP (13 APAC destinations incl. AU, JP, KR, CN, HK, TW, TH, PH, VN, IN)",
    price: 10.10,
    esim: true,
    notes: ""
  },
  {
    id: 4,
    provider: "Zero1",
    network: "Singtel",
    planName: "Movemo VIBE 4G",
    data: "400GB",
    dataSortValue: 400,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "600GB Malaysia & Indonesia (one-time, 365 days); 12GB RoamAP (13 APAC destinations)",
    price: 12.00,
    esim: true,
    notes: ""
  },
  {
    id: 5,
    provider: "Zero1",
    network: "Singtel",
    planName: "Jumbo Joy 5G",
    data: "401GB",
    dataSortValue: 401,
    networkType: "5G",
    callMinutes: "701 mins",
    sms: "201 SMS",
    roaming: "-",
    price: 12.70,
    esim: true,
    notes: "Includes 5G access"
  },
  {
    id: 6,
    provider: "Zero1",
    network: "Singtel",
    planName: "Streamo Freedom 5G",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G",
    callMinutes: "600 mins",
    sms: "100 SMS",
    roaming: "600GB Malaysia, Indonesia & Thailand (one-time, 365 days); 20GB RoamAP (13 APAC destinations)",
    price: 15.00,
    esim: true,
    notes: ""
  },
  {
    id: 7,
    provider: "Zero1",
    network: "Singtel",
    planName: "Movemo DASH 5G",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "600GB Malaysia, Indonesia & Thailand (one-time, 365 days); 20GB RoamAP (13 APAC destinations)",
    price: 20.00,
    esim: true,
    notes: ""
  },
  {
    id: 8,
    provider: "Zero1",
    network: "Singtel",
    planName: "Jumbo Pro 5G",
    data: "701GB",
    dataSortValue: 701,
    networkType: "5G",
    callMinutes: "1,001 mins",
    sms: "201 SMS",
    roaming: "-",
    price: 20.40,
    esim: true,
    notes: ""
  },

  // ========== CMLink (Network: Singtel) ==========
  {
    id: 9,
    provider: "CMLink",
    network: "Singtel",
    planName: "200GB 4G",
    data: "200GB",
    dataSortValue: 200,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "1GB mainland China & Hong Kong; 5GB Asia (6 countries incl. MY, TH, ID); 100GB Malaysia (one-time bonus)",
    price: 7.70,
    esim: true,
    notes: ""
  },
  {
    id: 10,
    provider: "CMLink",
    network: "Singtel",
    planName: "300GB 4G",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "3GB mainland China & Hong Kong; 12GB APAC (12 countries incl. AU, JP, KR, MY, TH, ID, PH, VN, TW); 600GB Malaysia & Indonesia (one-time, 365 days)",
    price: 10.10,
    esim: true,
    notes: ""
  },
  {
    id: 11,
    provider: "CMLink",
    network: "Singtel",
    planName: "400GB 5G",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G",
    callMinutes: "600 mins",
    sms: "100 SMS",
    roaming: "5GB mainland China & Hong Kong; 20GB APAC 12 (AU, CN, HK, MO, TW, ID, JP, MY, PH, KR, TH, VN); 600GB shared Indonesia, Malaysia & Thailand (one-time, 365 days)",
    price: 15.00,
    esim: true,
    notes: ""
  },
  {
    id: 12,
    provider: "CMLink",
    network: "Singtel",
    planName: "450GB 5G",
    data: "450GB",
    dataSortValue: 450,
    networkType: "5G",
    callMinutes: "800 mins",
    sms: "300 SMS",
    roaming: "40GB mainland China & Hong Kong; 22GB APAC (10 countries); 600GB Malaysia (one-time, 365 days); 300 IDD mins",
    price: 21.00,
    esim: true,
    notes: ""
  },
  {
    id: 13,
    provider: "CMLink",
    network: "Singtel",
    planName: "Unlimited 5G",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G",
    callMinutes: "1,000 mins",
    sms: "500 SMS",
    roaming: "60GB mainland China & Hong Kong; 24GB APAC (10 countries); 600GB Malaysia (one-time, 365 days); 400 IDD mins",
    price: 31.10,
    esim: true,
    notes: "500GB at full speed, then throttled to 512kbps"
  },

  // ========== VIVIFI (Network: Singtel) ==========
  {
    id: 14,
    provider: "VIVIFI",
    network: "Singtel",
    planName: "Roam Value 4G",
    data: "200GB",
    dataSortValue: 200,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "100GB Malaysia (one-time); 5GB across 6 Asia destinations",
    price: 7.70,
    esim: true,
    notes: ""
  },
  {
    id: 15,
    provider: "VIVIFI",
    network: "Singtel",
    planName: "VIBE 4G",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "588 mins",
    sms: "100 SMS",
    roaming: "600GB Malaysia & Indonesia (one-time, 365 days); 12GB across 13 Asia destinations",
    price: 10.00,
    esim: true,
    notes: "Bonus 5G+ access for 6 months"
  },
  {
    id: 16,
    provider: "VIVIFI",
    network: "Singtel",
    planName: "Plus 20 4G",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "4G",
    callMinutes: "400 mins",
    sms: "200 SMS",
    roaming: "600GB Malaysia (one-time, 365 days)",
    price: 11.50,
    esim: true,
    notes: ""
  },
  {
    id: 17,
    provider: "VIVIFI",
    network: "Singtel",
    planName: "Roam Asia Super 5G+",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G+",
    callMinutes: "800 mins",
    sms: "100 SMS",
    roaming: "600GB Malaysia, Indonesia & Thailand (one-time, 365 days); 20GB across 13 Asia destinations; Free 50GB Japan/Korea/Australia",
    price: 15.00,
    esim: true,
    notes: ""
  },
  {
    id: 18,
    provider: "VIVIFI",
    network: "Singtel",
    planName: "Roam Max 5G+",
    data: "600GB",
    dataSortValue: 600,
    networkType: "5G+",
    callMinutes: "1,000 mins",
    sms: "300 SMS",
    roaming: "800GB Malaysia, Indonesia & Thailand (one-time, 365 days); 20GB across 13 Asia destinations; Free 50GB Japan/Korea/Australia",
    price: 19.95,
    esim: true,
    notes: ""
  },
  {
    id: 19,
    provider: "VIVIFI",
    network: "Singtel",
    planName: "Roam Premium 5G+",
    data: "1TB",
    dataSortValue: 1000,
    networkType: "5G+",
    callMinutes: "2,000 mins",
    sms: "500 SMS",
    roaming: "1TB Malaysia, Indonesia & Thailand (one-time, 365 days); 30GB across 13 Asia destinations; Free 50GB Japan/Korea/Australia",
    price: 29.90,
    esim: true,
    notes: ""
  },

  // ========== Maxx (Network: M1) ==========
  {
    id: 20,
    provider: "Maxx",
    network: "M1",
    planName: "290GB 4G",
    data: "290GB",
    dataSortValue: 290,
    networkType: "4G",
    callMinutes: "500 mins",
    sms: "99 SMS",
    roaming: "10GB APAC roaming; 2GB International roaming",
    price: 7.90,
    esim: true,
    notes: "Data shared across SG & MY; promo price for first 12 cycles (reverts to $9.90)"
  },
  {
    id: 21,
    provider: "Maxx",
    network: "M1",
    planName: "400GB 5G",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G",
    callMinutes: "500 mins",
    sms: "50 SMS",
    roaming: "13GB APAC roaming; 3GB International roaming",
    price: 10.00,
    esim: true,
    notes: "Data shared across SG & MY"
  },
  {
    id: 22,
    provider: "Maxx",
    network: "M1",
    planName: "500GB 5G",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "500 mins",
    sms: "50 SMS",
    roaming: "20GB APAC roaming; 7GB International roaming",
    price: 12.00,
    esim: true,
    notes: "Data shared across SG, MY & ID"
  },

  // ========== MyRepublic (Network: M1 for 4G, StarHub for 5G) ==========
  {
    id: 23,
    provider: "MyRepublic",
    network: "M1",
    planName: "150GB 4G",
    data: "150GB",
    dataSortValue: 150,
    networkType: "4G",
    callMinutes: "200 mins",
    sms: "100 SMS",
    roaming: "1GB roaming",
    price: 6.00,
    esim: true,
    notes: ""
  },
  {
    id: 24,
    provider: "MyRepublic",
    network: "M1",
    planName: "300GB 4G",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "200 mins",
    sms: "100 SMS",
    roaming: "100GB Malaysia & Indonesia (one-time); 12GB APAC (15 countries incl. AU, JP, HK, IN, KR, TW, CN, PH, NZ, BD, LK, MO)",
    price: 7.90,
    esim: true,
    notes: ""
  },
  {
    id: 25,
    provider: "MyRepublic",
    network: "M1",
    planName: "300GB 4G (Port-in)",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "200 mins",
    sms: "100 SMS",
    roaming: "100GB Malaysia & Indonesia (one-time); 12GB APAC (15 countries)",
    price: 9.90,
    esim: true,
    notes: "Port-in offer"
  },
  {
    id: 26,
    provider: "MyRepublic",
    network: "M1",
    planName: "600GB 4G",
    data: "600GB",
    dataSortValue: 600,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "100GB Malaysia & Indonesia (one-time); 10GB APAC (15 countries)",
    price: 11.90,
    esim: true,
    notes: ""
  },
  {
    id: 27,
    provider: "MyRepublic",
    network: "StarHub",
    planName: "500GB 5G",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "800 mins",
    sms: "800 SMS",
    roaming: "100GB Malaysia, Indonesia & Thailand (one-time); 10GB APAC (15 countries incl. AU, JP, HK, IN, KR, TW, CN, PH, NZ, BD, LK, MO)",
    price: 14.95,
    esim: true,
    notes: ""
  },
  {
    id: 28,
    provider: "MyRepublic",
    network: "StarHub",
    planName: "650GB 5G",
    data: "650GB",
    dataSortValue: 650,
    networkType: "5G",
    callMinutes: "1,200 mins",
    sms: "1,200 SMS",
    roaming: "100GB Malaysia, Indonesia & Thailand (one-time); 12GB APAC (15 countries)",
    price: 16.95,
    esim: true,
    notes: ""
  },
  {
    id: 29,
    provider: "MyRepublic",
    network: "StarHub",
    planName: "850GB 5G",
    data: "850GB",
    dataSortValue: 850,
    networkType: "5G",
    callMinutes: "1,400 mins",
    sms: "1,400 SMS",
    roaming: "100GB Malaysia, Indonesia & Thailand (one-time); 15GB APAC (15 countries)",
    price: 19.95,
    esim: true,
    notes: ""
  },

  // ========== eight (Network: StarHub) ==========
  {
    id: 30,
    provider: "eight",
    network: "StarHub",
    planName: "Double Eight 4G",
    data: "388GB",
    dataSortValue: 388,
    networkType: "4G",
    callMinutes: "588 mins",
    sms: "88 SMS",
    roaming: "10GB APAC (MY, TH, ID); 2GB International; 288 IDD mins",
    price: 8.00,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },
  {
    id: 31,
    provider: "eight",
    network: "StarHub",
    planName: "Fortune Eight 4G",
    data: "488GB",
    dataSortValue: 488,
    networkType: "4G",
    callMinutes: "688 mins",
    sms: "128 SMS",
    roaming: "26GB APAC (MY, TH, ID); 8GB International; 388 IDD mins",
    price: 11.80,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },
  {
    id: 32,
    provider: "eight",
    network: "StarHub",
    planName: "Lucky Eight 5G",
    data: "588GB",
    dataSortValue: 588,
    networkType: "5G",
    callMinutes: "688 mins",
    sms: "128 SMS",
    roaming: "28GB APAC (MY, TH, ID, CN, KR); 8GB International; 388 IDD mins",
    price: 14.80,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },
  {
    id: 33,
    provider: "eight",
    network: "StarHub",
    planName: "Triple Eight 5G",
    data: "688GB",
    dataSortValue: 688,
    networkType: "5G",
    callMinutes: "888 mins",
    sms: "188 SMS",
    roaming: "36GB APAC (MY, TH, ID, CN, KR, JP); 18GB International; 488 IDD mins",
    price: 18.00,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },

  // ========== Circles.Life (Network: M1) ==========
  {
    id: 34,
    provider: "Circles.Life",
    network: "M1",
    planName: "4G Lite",
    data: "200GB",
    dataSortValue: 200,
    networkType: "4G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "-",
    price: 9.90,
    esim: true,
    notes: ""
  },
  {
    id: 35,
    provider: "Circles.Life",
    network: "M1",
    planName: "4G Core",
    data: "350GB",
    dataSortValue: 350,
    networkType: "4G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "1GB roaming",
    price: 10.80,
    esim: true,
    notes: ""
  },
  {
    id: 36,
    provider: "Circles.Life",
    network: "M1",
    planName: "5G Core",
    data: "200GB",
    dataSortValue: 200,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "-",
    price: 12.00,
    esim: true,
    notes: ""
  },
  {
    id: 37,
    provider: "Circles.Life",
    network: "M1",
    planName: "5G Plus",
    data: "300GB",
    dataSortValue: 300,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "8GB across Asia destinations",
    price: 12.88,
    esim: true,
    notes: ""
  },
  {
    id: 38,
    provider: "Circles.Life",
    network: "M1",
    planName: "5G Pro",
    data: "600GB",
    dataSortValue: 600,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "100GB Malaysia (one-time); 10GB global roaming",
    price: 14.88,
    esim: true,
    notes: ""
  },
  {
    id: 39,
    provider: "Circles.Life",
    network: "M1",
    planName: "5G Max",
    data: "1TB",
    dataSortValue: 1000,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "500GB Malaysia (one-time); 10GB global roaming (7 destinations)",
    price: 30.00,
    esim: true,
    notes: ""
  },
  {
    id: 40,
    provider: "Circles.Life",
    network: "M1",
    planName: "5G Ultra",
    data: "2TB",
    dataSortValue: 2048,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "Global roaming included",
    price: 32.00,
    esim: true,
    notes: ""
  },

  // ========== SIMBA (Network: SIMBA / TPG) ==========
  {
    id: 41,
    provider: "SIMBA",
    network: "SIMBA",
    planName: "Seniors Plan",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "100 SMS",
    roaming: "1GB Global roaming (60+ countries incl. AU, HK, JP, KR, CN, TW, ID, TH, MY, IN, NZ, VN)",
    price: 5.00,
    esim: true,
    notes: "For ages 60+; main data shared across SG, MY, HK"
  },
  {
    id: 42,
    provider: "SIMBA",
    network: "SIMBA",
    planName: "SuperRoam 10",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "100 SMS",
    roaming: "12GB APAC (MY, HK, ID, TW, TH, BD, VN); 3GB Global (60+ countries incl. AU, NZ, JP, KR, CN, IN); 500 IDD mins; main data shared across SG, MY, HK",
    price: 10.00,
    esim: true,
    notes: ""
  },
  {
    id: 43,
    provider: "SIMBA",
    network: "SIMBA",
    planName: "SuperRoam 12",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "100 SMS",
    roaming: "18GB APAC; 8GB Global (60+ countries); 600 IDD mins; data shared across SG, MY, ID, TH, HK",
    price: 12.00,
    esim: true,
    notes: ""
  },
  {
    id: 44,
    provider: "SIMBA",
    network: "SIMBA",
    planName: "SuperRoam 18",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "100 SMS",
    roaming: "30GB APAC; 10GB Global (60+ countries); data shared across SG, MY, ID, TH, HK",
    price: 18.00,
    esim: true,
    notes: ""
  },
  {
    id: 45,
    provider: "SIMBA",
    network: "SIMBA",
    planName: "SuperRoam 20",
    data: "600GB",
    dataSortValue: 600,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "100 SMS",
    roaming: "50GB APAC; 12GB Global (60+ countries); data shared across SG, MY, ID, TH, HK",
    price: 20.00,
    esim: true,
    notes: ""
  },
  {
    id: 46,
    provider: "SIMBA",
    network: "SIMBA",
    planName: "SuperRoam 25",
    data: "700GB",
    dataSortValue: 700,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "100 SMS",
    roaming: "80GB APAC (MY, HK, ID, TW, TH, BD, VN, CN, KR); 15GB Global (140+ countries incl. AU, NZ, JP, IN, in-flight); main data shared across SG, MY, ID, TH, HK",
    price: 25.00,
    esim: true,
    notes: ""
  },

  // ========== GOMO (Network: Singtel) ==========
  {
    id: 47,
    provider: "GOMO",
    network: "Singtel",
    planName: "4G Saver",
    data: "88GB",
    dataSortValue: 88,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "300 SMS",
    roaming: "12GB Malaysia",
    price: 10.18,
    esim: true,
    notes: ""
  },
  {
    id: 48,
    provider: "GOMO",
    network: "Singtel",
    planName: "5G+ Value",
    data: "300GB",
    dataSortValue: 300,
    networkType: "5G+",
    callMinutes: "800 mins",
    sms: "800 SMS",
    roaming: "300GB Malaysia; 10GB regional (5 destinations); 6GB International",
    price: 18.33,
    esim: true,
    notes: "Promo price available: $12.33/mth"
  },
  {
    id: 49,
    provider: "GOMO",
    network: "Singtel",
    planName: "4G Plus",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "500 mins",
    sms: "500 SMS",
    roaming: "6GB regional roaming",
    price: 15.00,
    esim: true,
    notes: ""
  },
  {
    id: 50,
    provider: "GOMO",
    network: "Singtel",
    planName: "5G+ Pro",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G+",
    callMinutes: "1,000 mins",
    sms: "1,000 SMS",
    roaming: "500GB Malaysia; 12GB regional; 2GB International",
    price: 20.99,
    esim: true,
    notes: "Promo price available: $14.99/mth"
  },
  {
    id: 51,
    provider: "GOMO",
    network: "Singtel",
    planName: "5G+ Jetsetter",
    data: "1TB",
    dataSortValue: 1000,
    networkType: "5G+",
    callMinutes: "1,500 mins",
    sms: "1,500 SMS",
    roaming: "16GB regional; 3GB International",
    price: 27.15,
    esim: true,
    notes: ""
  },

  // ========== giga! (Network: StarHub) ==========
  {
    id: 52,
    provider: "giga!",
    network: "StarHub",
    planName: "100GB 4G",
    data: "100GB",
    dataSortValue: 100,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "300 SMS",
    roaming: "2GB Asia (MY, ID, TH, IN, KR)",
    price: 10.90,
    esim: true,
    notes: "Data rollover"
  },
  {
    id: 53,
    provider: "giga!",
    network: "StarHub",
    planName: "200GB 4G",
    data: "200GB",
    dataSortValue: 200,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "300 SMS",
    roaming: "4GB Asia (MY, ID, TH, IN, KR)",
    price: 12.90,
    esim: true,
    notes: "Data rollover"
  },
  {
    id: 54,
    provider: "giga!",
    network: "StarHub",
    planName: "300GB 5G",
    data: "300GB",
    dataSortValue: 300,
    networkType: "5G",
    callMinutes: "300 mins",
    sms: "300 SMS",
    roaming: "8GB Asia",
    price: 15.90,
    esim: true,
    notes: ""
  },
  {
    id: 55,
    provider: "giga!",
    network: "StarHub",
    planName: "400GB 5G",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G",
    callMinutes: "800 mins",
    sms: "800 SMS",
    roaming: "10GB Asia; 6GB International (48 destinations); data shared across SG & MY",
    price: 18.90,
    esim: true,
    notes: ""
  },
  {
    id: 56,
    provider: "giga!",
    network: "StarHub",
    planName: "500GB 5G",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "1,000 mins",
    sms: "1,000 SMS",
    roaming: "11GB Asia; 8GB International (48 destinations); data shared across SG, MY & ID",
    price: 19.90,
    esim: true,
    notes: ""
  },
  {
    id: 57,
    provider: "giga!",
    network: "StarHub",
    planName: "500GB 5G Plus",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "1,000 mins",
    sms: "1,000 SMS",
    roaming: "12GB Asia; 10GB International (48 destinations); data shared across SG & MY",
    price: 20.90,
    esim: true,
    notes: ""
  },
  {
    id: 58,
    provider: "giga!",
    network: "StarHub",
    planName: "1TB 5G",
    data: "1TB",
    dataSortValue: 1000,
    networkType: "5G",
    callMinutes: "1,500 mins",
    sms: "1,500 SMS",
    roaming: "16GB Asia; 12GB International (48 destinations); data shared across SG & MY",
    price: 28.90,
    esim: true,
    notes: ""
  },

  // ========== redONE (Network: StarHub) ==========
  {
    id: 59,
    provider: "redONE",
    network: "StarHub",
    planName: "BEST10",
    data: "450GB",
    dataSortValue: 450,
    networkType: "4G",
    callMinutes: "500 mins",
    sms: "200 SMS",
    roaming: "12GB across 16 destinations (TH, CN, MO, HK, TW, KR, JP, IN, PH, AU, NZ, BN, KH, LA, VN, MM); data shared across SG, MY & ID; 100 IDD mins (MY)",
    price: 10.90,
    esim: false,
    notes: ""
  },
  {
    id: 60,
    provider: "redONE",
    network: "StarHub",
    planName: "BEST20",
    data: "650GB",
    dataSortValue: 650,
    networkType: "4G",
    callMinutes: "1,000 mins",
    sms: "500 SMS",
    roaming: "25GB across 15 destinations (CN, MO, HK, TW, KR, JP, IN, PH, AU, NZ, BN, KH, LA, VN, MM); data shared across SG, MY, ID & TH; 250 IDD mins (MY)",
    price: 20.90,
    esim: false,
    notes: ""
  },

  // ========== M1 (Network: M1) ==========
  {
    id: 61,
    provider: "M1",
    network: "M1",
    planName: "Bespoke 150GB 5G",
    data: "150GB",
    dataSortValue: 150,
    networkType: "5G",
    callMinutes: "1,000 mins",
    sms: "1,000 SMS",
    roaming: "-",
    price: 14.95,
    esim: true,
    notes: "Promo: $11.95/mth for first 3 months; free unlimited weekend data"
  },
  {
    id: 62,
    provider: "M1",
    network: "M1",
    planName: "Bespoke 1TB 5G",
    data: "1TB",
    dataSortValue: 1000,
    networkType: "5G",
    callMinutes: "1,000 mins",
    sms: "1,000 SMS",
    roaming: "-",
    price: 17.95,
    esim: true,
    notes: "Promo: $14.95/mth for first 3 months; free unlimited weekend data"
  },
  {
    id: 63,
    provider: "M1",
    network: "M1",
    planName: "Bespoke 1TB + Worldwide 5G",
    data: "1TB",
    dataSortValue: 1000,
    networkType: "5G",
    callMinutes: "1,000 mins",
    sms: "1,000 SMS",
    roaming: "1GB worldwide roaming (74 destinations)",
    price: 22.95,
    esim: true,
    notes: "Free unlimited weekend data"
  },

  // ========== Singtel (Network: Singtel) ==========
  {
    id: 64,
    provider: "Singtel",
    network: "Singtel",
    planName: "SIM Only Enhanced Lite 5G+",
    data: "300GB",
    dataSortValue: 300,
    networkType: "5G+",
    callMinutes: "400 mins",
    sms: "400 SMS",
    roaming: "10GB Malaysia roaming",
    price: 24.50,
    esim: true,
    notes: "Online exclusive price (U.P. $35)"
  },
  {
    id: 65,
    provider: "Singtel",
    network: "Singtel",
    planName: "SIM Only Enhanced Core 5G+",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G+",
    callMinutes: "700 mins",
    sms: "700 SMS",
    roaming: "50GB Malaysia; 5GB Asia roaming",
    price: 40.00,
    esim: true,
    notes: ""
  },
  {
    id: 66,
    provider: "Singtel",
    network: "Singtel",
    planName: "SIM Only Priority Plus 5G+",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G+",
    callMinutes: "1,000 mins",
    sms: "1,000 SMS",
    roaming: "Unlimited Malaysia; 13GB Asia roaming",
    price: 55.00,
    esim: true,
    notes: "Priority network access"
  },
  {
    id: 67,
    provider: "Singtel",
    network: "Singtel",
    planName: "SIM Only Priority Ultra 5G+",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G+",
    callMinutes: "1,500 mins",
    sms: "1,500 SMS",
    roaming: "Unlimited Malaysia; 18GB worldwide; 6GB Asia roaming",
    price: 80.00,
    esim: true,
    notes: "Premium priority network access"
  },
  {
    id: 68,
    provider: "Singtel",
    network: "Singtel",
    planName: "hi! $15 5G Prepaid",
    data: "100GB",
    dataSortValue: 100,
    networkType: "5G",
    callMinutes: "500 mins",
    sms: "Unlimited",
    roaming: "5GB roaming (MY, IN, TH, BD)",
    price: 15.00,
    esim: true,
    notes: "Prepaid 4-week plan"
  },
  {
    id: 69,
    provider: "Singtel",
    network: "Singtel",
    planName: "hi! $20 5G Prepaid",
    data: "200GB",
    dataSortValue: 200,
    networkType: "5G",
    callMinutes: "1,000 mins",
    sms: "Unlimited",
    roaming: "10GB roaming (MY, IN, TH, BD)",
    price: 20.00,
    esim: true,
    notes: "Prepaid 4-week plan"
  },
  {
    id: 70,
    provider: "Singtel",
    network: "Singtel",
    planName: "hi! $25 5G+ Ultimate",
    data: "288GB",
    dataSortValue: 288,
    networkType: "5G+",
    callMinutes: "2,800 mins",
    sms: "880 SMS",
    roaming: "228GB roaming (MY, IN, TH, BD)",
    price: 25.00,
    esim: true,
    notes: "Prepaid 4-week plan"
  },

  // ========== StarHub (Network: StarHub) ==========
  {
    id: 71,
    provider: "StarHub",
    network: "StarHub",
    planName: "5G Unlimited+ Lite",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "1GB regional (5 countries); 1GB global (165 countries)",
    price: 22.00,
    esim: true,
    notes: "ScamSafe protection included"
  },
  {
    id: 72,
    provider: "StarHub",
    network: "StarHub",
    planName: "5G Unlimited+ Core",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "5GB regional (5 countries); 3GB global (165 countries); unlimited roaming calls & SMS",
    price: 38.00,
    esim: true,
    notes: "$5 DeviceDollars monthly"
  },
  {
    id: 73,
    provider: "StarHub",
    network: "StarHub",
    planName: "5G Unlimited+ Plus",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "10GB APAC (20 destinations); 5GB global (165 countries); unlimited roaming calls & SMS",
    price: 48.00,
    esim: true,
    notes: "$10 DeviceDollars monthly"
  },
  {
    id: 74,
    provider: "StarHub",
    network: "StarHub",
    planName: "5G Unlimited+ Max",
    data: "Unlimited",
    dataSortValue: 99999,
    networkType: "5G",
    callMinutes: "Unlimited",
    sms: "Unlimited",
    roaming: "20GB global (165 countries); unlimited roaming calls & SMS",
    price: 78.00,
    esim: true,
    notes: "$20 DeviceDollars monthly"
  },

  // ========== ZYM Mobile (Network: Singtel) ==========
  {
    id: 75,
    provider: "ZYM Mobile",
    network: "Singtel",
    planName: "Flexi Duo 4G",
    data: "77GB",
    dataSortValue: 77,
    networkType: "4G",
    callMinutes: "Free incoming",
    sms: "-",
    roaming: "100GB Malaysia (one-time, 90 days); data shared across SG & MY",
    price: 7.00,
    esim: true,
    notes: "Data-only SIM"
  },
  {
    id: 76,
    provider: "ZYM Mobile",
    network: "Singtel",
    planName: "Roam Saver 4G",
    data: "200GB",
    dataSortValue: 200,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "100 SMS",
    roaming: "3GB shared/mth across 6 destinations (MY, ID, TH, TW, PH, IN); 100GB Malaysia bonus (one-time, 365 days)",
    price: 7.77,
    esim: true,
    notes: "Data rollover"
  },
  {
    id: 77,
    provider: "ZYM Mobile",
    network: "Singtel",
    planName: "Roam Plus 4G",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "1,000 mins",
    sms: "100 SMS",
    roaming: "5GB shared/mth across 13 destinations (MY, ID, TH, TW, PH, IN, JP, KR, AU, CN, HK, MO, VN); 600GB Malaysia & Indonesia bonus (one-time, 365 days)",
    price: 10.10,
    esim: true,
    notes: "Data rollover"
  },
  {
    id: 78,
    provider: "ZYM Mobile",
    network: "Singtel",
    planName: "Roam Smart 5G+",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G+",
    callMinutes: "2,000 mins",
    sms: "100 SMS",
    roaming: "15GB shared/mth across 13 destinations (MY, ID, TH, TW, PH, IN, JP, KR, AU, CN, HK, MO, VN); 600GB Malaysia, Indonesia & Thailand bonus (one-time, 365 days)",
    price: 15.10,
    esim: true,
    notes: "Permanent 5G+; data rollover"
  },
  {
    id: 79,
    provider: "ZYM Mobile",
    network: "Singtel",
    planName: "Roam Eco 5G+",
    data: "550GB",
    dataSortValue: 550,
    networkType: "5G+",
    callMinutes: "1,000 mins",
    sms: "100 SMS",
    roaming: "5GB shared/mth across 13 destinations; 600GB Malaysia & Indonesia bonus (one-time, 365 days)",
    price: 17.10,
    esim: true,
    notes: "Data rollover"
  },
  {
    id: 80,
    provider: "ZYM Mobile",
    network: "Singtel",
    planName: "Roam Power 5G+",
    data: "700GB",
    dataSortValue: 700,
    networkType: "5G+",
    callMinutes: "2,000 mins",
    sms: "100 SMS",
    roaming: "15GB shared/mth across 13 destinations; 600GB Malaysia, Indonesia & Thailand bonus (one-time, 365 days)",
    price: 22.10,
    esim: true,
    notes: "Data rollover"
  },

  // ========== CUniq / China Unicom (Network: StarHub) ==========
  {
    id: 81,
    provider: "CUniq",
    network: "StarHub",
    planName: "One Asia 4G A",
    data: "300GB",
    dataSortValue: 300,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "300 SMS",
    roaming: "20GB mainland China; 10GB APAC (MY, ID, TH, HK); 100 IDD mins",
    price: 9.90,
    esim: true,
    notes: "Data rollover (max 600GB); free incoming calls & Caller ID"
  },
  {
    id: 82,
    provider: "CUniq",
    network: "StarHub",
    planName: "One Asia 4G B",
    data: "400GB",
    dataSortValue: 400,
    networkType: "4G",
    callMinutes: "400 mins",
    sms: "400 SMS",
    roaming: "35GB mainland China; 20GB APAC (MY, ID, TH, HK); 100 IDD mins",
    price: 14.90,
    esim: true,
    notes: "Data rollover (max 800GB); free incoming calls & Caller ID"
  },
  {
    id: 83,
    provider: "CUniq",
    network: "StarHub",
    planName: "One Asia 5G A",
    data: "500GB",
    dataSortValue: 500,
    networkType: "5G",
    callMinutes: "500 mins",
    sms: "500 SMS",
    roaming: "50GB mainland China; 30GB APAC (MY, ID, TH, HK); 100 IDD mins",
    price: 24.90,
    esim: true,
    notes: "Data rollover (max 1000GB); free 12-month 1C2N dual number; free incoming calls & Caller ID"
  },
  {
    id: 84,
    provider: "CUniq",
    network: "StarHub",
    planName: "One Asia 5G B",
    data: "600GB",
    dataSortValue: 600,
    networkType: "5G",
    callMinutes: "600 mins",
    sms: "600 SMS",
    roaming: "80GB mainland China; 40GB APAC (MY, ID, TH, HK); 100 IDD mins",
    price: 29.90,
    esim: true,
    notes: "Data rollover (max 1200GB); free 12-month 1C2N dual number; free incoming calls & Caller ID"
  },
  {
    id: 85,
    provider: "CUniq",
    network: "StarHub",
    planName: "Hassle-free 100GB 4G",
    data: "100GB",
    dataSortValue: 100,
    networkType: "4G",
    callMinutes: "300 mins",
    sms: "300 SMS",
    roaming: "2GB APAC (MY, TH, ID)",
    price: 10.90,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },
  {
    id: 86,
    provider: "CUniq",
    network: "StarHub",
    planName: "Hassle-free 200GB 4G",
    data: "200GB",
    dataSortValue: 200,
    networkType: "4G",
    callMinutes: "400 mins",
    sms: "400 SMS",
    roaming: "4GB APAC (MY, TH, ID)",
    price: 15.10,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },
  {
    id: 87,
    provider: "CUniq",
    network: "StarHub",
    planName: "Hassle-free 300GB 5G",
    data: "300GB",
    dataSortValue: 300,
    networkType: "5G",
    callMinutes: "600 mins",
    sms: "600 SMS",
    roaming: "6GB APAC (MY, TH, ID)",
    price: 25.20,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },
  {
    id: 88,
    provider: "CUniq",
    network: "StarHub",
    planName: "Hassle-free 400GB 5G",
    data: "400GB",
    dataSortValue: 400,
    networkType: "5G",
    callMinutes: "800 mins",
    sms: "800 SMS",
    roaming: "8GB APAC (MY, TH, ID)",
    price: 35.30,
    esim: true,
    notes: "Free incoming calls & Caller ID"
  },
];

export const providers = [...new Set(plans.map(p => p.provider))].sort();
export const networks = [...new Set(plans.map(p => p.network))].sort();
export const networkTypes = ["4G", "5G", "5G+"] as const;

/** All unique roaming countries across all plans, sorted by full name */
export const allRoamingCountries: string[] = (() => {
  const all = new Set<string>();
  for (const p of plans) {
    for (const c of extractRoamingCountries(p.roaming)) {
      all.add(c);
    }
  }
  return [...all].sort((a, b) =>
    (COUNTRY_MAP[a] || a).localeCompare(COUNTRY_MAP[b] || b)
  );
})();
