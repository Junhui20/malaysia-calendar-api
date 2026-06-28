import { Hono } from "hono";

// Authoritative JAKIM prayer-time zones (source: api.waktusolat.app/zones).
interface Zone {
  readonly code: string;
  readonly state: string;
  readonly area: string;
}

const ZONES: readonly Zone[] = [
  { code: "JHR01", state: "Johor", area: "Pulau Aur dan Pulau Pemanggil" },
  { code: "JHR02", state: "Johor", area: "Johor Bahru, Kota Tinggi, Mersing, Kulai" },
  { code: "JHR03", state: "Johor", area: "Kluang, Pontian" },
  { code: "JHR04", state: "Johor", area: "Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak" },
  { code: "KDH01", state: "Kedah", area: "Kota Setar, Kubang Pasu, Pokok Sena" },
  { code: "KDH02", state: "Kedah", area: "Kuala Muda, Yan, Pendang" },
  { code: "KDH03", state: "Kedah", area: "Padang Terap, Sik" },
  { code: "KDH04", state: "Kedah", area: "Baling" },
  { code: "KDH05", state: "Kedah", area: "Bandar Baharu, Kulim" },
  { code: "KDH06", state: "Kedah", area: "Langkawi" },
  { code: "KDH07", state: "Kedah", area: "Puncak Gunung Jerai" },
  { code: "KTN01", state: "Kelantan", area: "Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku" },
  { code: "KTN02", state: "Kelantan", area: "Gua Musang, Jeli, Lojing" },
  { code: "MLK01", state: "Melaka", area: "Seluruh Negeri Melaka" },
  { code: "NGS01", state: "Negeri Sembilan", area: "Tampin, Jempol" },
  { code: "NGS02", state: "Negeri Sembilan", area: "Jelebu, Kuala Pilah, Rembau" },
  { code: "NGS03", state: "Negeri Sembilan", area: "Port Dickson, Seremban" },
  { code: "PHG01", state: "Pahang", area: "Pulau Tioman" },
  { code: "PHG02", state: "Pahang", area: "Kuantan, Pekan, Muadzam Shah" },
  { code: "PHG03", state: "Pahang", area: "Jerantut, Temerloh, Maran, Bera, Chenor, Jengka" },
  { code: "PHG04", state: "Pahang", area: "Bentong, Lipis, Raub" },
  { code: "PHG05", state: "Pahang", area: "Genting Sempah, Janda Baik, Bukit Tinggi" },
  { code: "PHG06", state: "Pahang", area: "Cameron Highlands, Genting Highlands, Bukit Fraser" },
  { code: "PHG07", state: "Pahang", area: "Rompin (Mukim Rompin, Endau, Pontian)" },
  { code: "PRK01", state: "Perak", area: "Tapah, Slim River, Tanjung Malim" },
  { code: "PRK02", state: "Perak", area: "Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar" },
  { code: "PRK03", state: "Perak", area: "Lenggong, Pengkalan Hulu, Grik" },
  { code: "PRK04", state: "Perak", area: "Temengor, Belum" },
  { code: "PRK05", state: "Perak", area: "Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor" },
  { code: "PRK06", state: "Perak", area: "Selama, Taiping, Bagan Serai, Parit Buntar" },
  { code: "PRK07", state: "Perak", area: "Bukit Larut" },
  { code: "PLS01", state: "Perlis", area: "Seluruh Negeri Perlis" },
  { code: "PNG01", state: "Pulau Pinang", area: "Seluruh Negeri Pulau Pinang" },
  { code: "SBH01", state: "Sabah", area: "Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Sukau" },
  { code: "SBH02", state: "Sabah", area: "Beluran, Telupid, Pinangah, Terusan, Kuamut, Sandakan (Barat)" },
  { code: "SBH03", state: "Sabah", area: "Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Tawau (Timur)" },
  { code: "SBH04", state: "Sabah", area: "Bandar Tawau, Balong, Merotai, Kalabakan, Tawau (Barat)" },
  { code: "SBH05", state: "Sabah", area: "Kudat, Kota Marudu, Pitas, Pulau Banggi" },
  { code: "SBH06", state: "Sabah", area: "Gunung Kinabalu" },
  { code: "SBH07", state: "Sabah", area: "Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan" },
  { code: "SBH08", state: "Sabah", area: "Pensiangan, Keningau, Tambunan, Nabawan" },
  { code: "SBH09", state: "Sabah", area: "Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston" },
  { code: "SWK01", state: "Sarawak", area: "Limbang, Lawas, Sundar, Trusan" },
  { code: "SWK02", state: "Sarawak", area: "Miri, Niah, Bekenu, Sibuti, Marudi" },
  { code: "SWK03", state: "Sarawak", area: "Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu" },
  { code: "SWK04", state: "Sarawak", area: "Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit" },
  { code: "SWK05", state: "Sarawak", area: "Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai" },
  { code: "SWK06", state: "Sarawak", area: "Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok" },
  { code: "SWK07", state: "Sarawak", area: "Serian, Simunjan, Samarahan, Sebuyau, Meludam" },
  { code: "SWK08", state: "Sarawak", area: "Kuching, Bau, Lundu, Sematan" },
  { code: "SWK09", state: "Sarawak", area: "Zon Khas (Kampung Patarikan)" },
  { code: "SGR01", state: "Selangor", area: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
  { code: "SGR02", state: "Selangor", area: "Kuala Selangor, Sabak Bernam" },
  { code: "SGR03", state: "Selangor", area: "Klang, Kuala Langat" },
  { code: "TRG01", state: "Terengganu", area: "Kuala Terengganu, Marang, Kuala Nerus" },
  { code: "TRG02", state: "Terengganu", area: "Besut, Setiu" },
  { code: "TRG03", state: "Terengganu", area: "Hulu Terengganu" },
  { code: "TRG04", state: "Terengganu", area: "Dungun, Kemaman" },
  { code: "WLY01", state: "Wilayah Persekutuan", area: "Kuala Lumpur, Putrajaya" },
  { code: "WLY02", state: "Wilayah Persekutuan", area: "Labuan" },
];

const ZONE_SET = new Set(ZONES.map((z) => z.code));

// Prayer keys in JAKIM/Waktu Solat order. Values are Unix epoch seconds.
const PRAYER_KEYS = ["imsak", "fajr", "syuruk", "dhuha", "dhuhr", "asr", "maghrib", "isha"] as const;

// Malaysia is a fixed UTC+8 with no DST, so HH:MM = epoch shifted +8h.
function toMyt(epoch: number): string {
  return new Date((epoch + 8 * 3600) * 1000).toISOString().slice(11, 16);
}

export const prayerTimesRouter = new Hono();

// GET /v1/prayer-times/zones — the JAKIM zone directory
prayerTimesRouter.get("/zones", (c) => {
  c.header("Cache-Control", "public, max-age=604800");
  return c.json({ data: ZONES, meta: { total: ZONES.length, source: "JAKIM (via api.waktusolat.app)" } });
});

// GET /v1/prayer-times/:zone?year=2026&month=6 — times for a JAKIM zone
prayerTimesRouter.get("/:zone", async (c) => {
  const zone = c.req.param("zone").toUpperCase();
  if (!ZONE_SET.has(zone)) {
    return c.json(
      { error: { code: "INVALID_ZONE", message: `Unknown JAKIM zone "${zone}". See /v1/prayer-times/zones.` } },
      400
    );
  }

  const params = new URLSearchParams();
  const year = c.req.query("year");
  const month = c.req.query("month");
  if (year) params.set("year", year);
  if (month) params.set("month", month);
  const qs = params.toString();
  const upstream = `https://api.waktusolat.app/v2/solat/${zone}${qs ? `?${qs}` : ""}`;

  let res: Response;
  try {
    res = await fetch(upstream, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  } catch {
    return c.json({ error: { code: "UPSTREAM_ERROR", message: "Could not reach the prayer-times source." } }, 502);
  }
  if (!res.ok) {
    return c.json({ error: { code: "UPSTREAM_ERROR", message: `Prayer-times source returned ${res.status}.` } }, 502);
  }

  const body = (await res.json()) as { zone?: string; year?: number; month?: string; prayers?: Array<Record<string, number>> };

  // Add human-readable MYT HH:MM next to the raw epoch values.
  const prayers = Array.isArray(body.prayers)
    ? body.prayers.map((p) => {
        const times: Record<string, string> = {};
        for (const k of PRAYER_KEYS) {
          if (typeof p[k] === "number") times[k] = toMyt(p[k]);
        }
        return { ...p, times };
      })
    : body.prayers;

  c.header("Cache-Control", "public, max-age=43200"); // 12h
  return c.json({
    data: { zone: body.zone ?? zone, year: body.year, month: body.month, prayers },
    meta: { zone, source: "JAKIM (via api.waktusolat.app)", timezone: "Asia/Kuala_Lumpur" },
  });
});
