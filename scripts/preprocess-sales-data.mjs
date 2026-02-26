#!/usr/bin/env node
/**
 * Viasox Sales Data Preprocessor
 *
 * Reads ALL rows from orders, customers, and reviews CSVs.
 * Links reviewers to purchase history via email.
 * Tags every review with segments using the same regex patterns as the app.
 * Outputs a single enriched JSON file for the Persona Builder.
 *
 * Usage:
 *   node scripts/preprocess-sales-data.mjs
 *
 * Input files (auto-detected from sibling folder):
 *   - Orders - *.csv  (3.5M+ rows — streamed, not loaded into memory)
 *   - Customer - *.csv (1M+ rows — streamed)
 *   - Viasox Reviews W Email - *.csv (128K reviews — loaded into memory)
 *
 * Output:
 *   src/data/salesEnrichment.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(PROJECT_ROOT, '..', 'VSX Intelligence CSV Data Files');
const OUTPUT_PATH = path.resolve(PROJECT_ROOT, 'src', 'data', 'salesEnrichment.json');

// ─── Product Type Mapping ────────────────────────────────────────────────────
// Maps Shopify "Product type" values to our 3 product categories.
// Products that can't be mapped go to "Other" and are still counted for revenue/orders.

const PRODUCT_TYPE_MAP = {
  'Easy Stretch':              'EasyStretch',
  'ES Bundle':                 'EasyStretch',
  'ES Gripper':                'EasyStretch',
  'Diabetic Socks':            'EasyStretch',
  'Compression Socks':         'Compression',
  'COM Bundle':                'Compression',
  'COM Gripper':               'Compression',
  'Ankle Compression Socks':   'Ankle Compression',
  'AC Bundle':                 'Ankle Compression',
  'ACS Gripper':               'Ankle Compression',
  'Ankle Socks':               'Ankle Compression',
  'ANK Bundle':                'Ankle Compression',
  // These can't be mapped to a specific product line
  'Mystery':                   'Other',
  'Bundle':                    'Other',
  'Subscription':              'Other',
  'Pain Relief Gel':           'Other',
  'Socks':                     'Other',
};

// ─── Segment Patterns (identical to src/engine/patterns.ts) ──────────────────
// Copied verbatim to ensure identical tagging. If patterns.ts changes, update here.

const IDENTITY_SEGMENT_PATTERNS = {
  healthcare_worker: /\b(nurse|nursing|hospital|12[- ]?hour shift|healthcare|CNA|medical (staff|professional)|in the (ER|OR|ICU)|on rounds|scrubs)\b/i,
  caregiver_gift_buyer: /\b(bought (for|these for)|got (these|them) for|my (mom|mother|dad|father|husband|wife|parent|grandm|grandp|grandfather|grandmother)|gift|stocking stuffer|(christmas|birthday|mother'?s?|father'?s?) (day )?gift|for (him|her)|surprise(d)? (them|him|her)|perfect gift)\b/i,
  diabetic_neuropathy: /\b(diabeti[cs]?|diabetes|blood sugar|type [12]|A1C|neuropathy|nerve (damage|pain)|sugar level|insulin)\b/i,
  standing_worker: /\b(stand(ing)? all day|on (my|your|their) feet|retail|teacher|teaching|warehouse|factory|behind the counter|concrete floor|delivery|hairstylist|stylist|bartend|waitress|waiter|server|cashier)\b/i,
  accessibility_mobility: /\b(paralys|paralyzed|arthritis|rheumatoid|hip (issue|problem|replacement)|knee replacement|wheelchair|limited mobility|range of motion|bad (back|knee|hip)|can't (bend|reach)|sock aid|fibromyalgia|fibro|lupus|gout|sciatica|stenosis)\b/i,
  traveler: /\b(travel|flight|airplane|aeroplane|vacation|trip|long (flight|drive)|road trip|hotel|airport|flying|flew|cruise)\b/i,
  senior: /\b(([5-9]\d|1\d{2})[- ]?(year|yr)[- ]?old|elderly|senior|aging|getting older|at my age|older (adult|person|gentleman|lady|woman|man))\b/i,
  pregnant_postpartum: /\b(pregnan|expecting|maternity|postpartum|post-?partum|baby bump|trimester|prenatal|swelling during pregnan)\b/i,
  medical_therapeutic: /\b(doctor (recommended|told|said|prescribed)|physician|podiatrist|prescribed|varicose|spider vein|vericose|DVT|blood clot|deep vein|post[- ]?surg|after (my )?surgery|post[- ]?op|chemo|chemotherapy|wound care|ulcer|dialysis|lymphedema|edema|heart (condition|failure)|mmHg|compression level|medical[- ]?grade|physical therapy|\bPT\b|rehab)\b/i,
};

const MOTIVATION_SEGMENT_PATTERNS = {
  comfort_seeker: /\b(comfort|comfortable|soft|cozy|cushion|plush|comfy|gentle|breathab|like a cloud|second skin|heavenly|baby soft|silky|pamper|like butter|feels? (great|amazing|wonderful|incredible|fantastic)|forget I'm wearing|don't (even )?feel|like wearing nothing|most comfortable|so soft|not itchy|no itch|snug but not tight|don't pinch|no pressure)\b/i,
  pain_symptom_relief: /\b(swell|swollen|pain|ache|achy|hurt|sore|cramp|throb|numb|tingling|burning|heavy legs|tired (feet|legs)|circulation|blood flow|stiff|inflammation|flare|acts? up|bother|pins and needles|heel pain|arch pain|plantar|planter|calf pain|restless leg|shooting pain|feet (were|are) killing|reduce.{0,10}(swelling|pain|pressure))\b/i,
  style_conscious: /\b(cute|pretty|beautiful|stylish|fashion|love the (color|pattern|design)|fun (design|pattern)|trendy|look(s)? (good|great|nice)|compliment|got compliment|people ask|not ugly|don't look (like )?medical|doesn't look (like )?compress|eye.?catching|vibrant|bold (color|pattern)|sleek|modern|attractive|professional look|doesn't scream|no one can tell|love the design|variety of (color|pattern|style)|not embarrass|actually look nice|wore them to (work|the office))\b/i,
  quality_value: /\b(worth (every|the) (penny|price|money)|well made|well-made|held up|holding up|after (several|many|dozens of) wash|still like new|durable|durability|don't wear out|no holes|high quality|good quality|better than|tried other|compared to|you get what you pay|investment|last (a long time|forever)|didn't pill|no pilling|didn't shrink|color didn't fade|elastic held|didn't lose.{0,10}shape|well constructed|premium|bang for|money well spent|not flimsy|built to last)\b/i,
  daily_wear_convert: /\b(every ?day|daily|all I wear|only socks? I (wear|buy|use)|replaced all|threw out|go-?to|wardrobe staple|wear.{0,10}everything|all[- ]?day comfort|morning to night|Monday through Friday|work week|reliable|never disappoints|can count on|grab a pair|in my rotation|enough pairs|no fuss|hassle ?free|just works|perfect for daily|around the house|for work|to the office|all day|whole drawer)\b/i,
  skeptic_converted: /\b(skeptic|sceptic|didn't (think|believe|expect)|wasn't sure|hesitant|took a chance|figured I'?d try|pleasantly surprised|pleasant surprise|proved me wrong|I was wrong|actually work|to my surprise|have to admit|I'll admit|exceeded (my )?expectation|better than expected|blew me away|I stand corrected|I'm a (convert|believer)|thought it was (hype|gimmick)|gave it a shot|last resort|tried everything|nothing else worked|glad I tried|should have tried sooner)\b/i,
  emotional_transformer: /\b(life.?chang|changed my life|game.?changer|miracle|godsend|god.?send|blessing|saved (my|me)|gave me.{0,10}(life|back)|can (walk|sleep|move) again|no more pain|pain.?free|night and day|used to (dread|hate|struggle)|dreaded|now I can|now I'm able|for the first time in|I cried|made me cry|tears?|so grateful|grateful|thank (you|god)|amazing difference|transformed|never going back|can't live without|essential|necessity|best thing|such relief|instant relief|freedom|gave me my|finally (found|a sock|something))\b/i,
  repeat_loyalist: /\b(order(ed|ing)? (again|more)|back for more|second pair|third pair|fourth pair|fifth pair|buying more|stocking up|this time I (got|ordered)|already (have|own)|been buying.{0,10}(for years|for months)|loyal customer|keep coming back|won't buy anything else|switched to these|never going back to|my (second|third|fourth|fifth|\d+(st|nd|rd|th)) order|still (love|great)|just as good as|consistent quality|haven't changed|every few months|replacing my|wore.{0,10}(last|old) (ones?|pair)|time to restock|whole drawer|recommended to|told (my |every)|entire family|customer for life|brand loyal)\b/i,
};

const ALL_SEGMENT_PATTERNS = { ...IDENTITY_SEGMENT_PATTERNS, ...MOTIVATION_SEGMENT_PATTERNS };

const PAIN_PATTERNS = {
  sock_marks: /\b(mark|indent|ring|line|groove|imprint|red ring|left.{0,10}mark|dig(ging)? in)\b/i,
  swelling: /\b(swell|swollen|edema|puff|bloat|retention|fluid|lymphedema|water retention)\b/i,
  tightness: /\b(tight|squeeze|constrict|tourniquet|cutting off|strangle|binding|dig into)\b/i,
  hard_to_put_on: /\b(hard to (put|get) on|struggle|can't get on|need help|difficult|fight me|battle)\b/i,
  falling_down: /\b(fall down|slide|slip|bunch|roll down|won't stay)\b/i,
  circulation: /\b(circulation|numb|purple|blood flow|tingling|pins and needles)\b/i,
  pain: /\b(pain|ache|achy|hurt|sore|cramp|throb|burning|burning sensation|tender)\b/i,
  neuropathy: /\b(neuropathy|nerve|nerve damage|nerve pain)\b/i,
  heavy_tired_legs: /\b(heavy legs|legs? feel heavy|tired (feet|legs)|fatigued? (feet|legs))\b/i,
  restless_legs: /\b(restless leg|can't sleep.{0,15}leg|leg.{0,10}at night)\b/i,
};

const BENEFIT_PATTERNS = {
  comfort: /\b(comfort|comfortable|soft|cozy|cushion|plush|comfy|gentle|like a cloud|second skin|heavenly)\b/i,
  no_marks: /\b(no mark|no indent|no ring|mark-free|without mark|no red|don't leave mark|doesn't leave)\b/i,
  easy_application: /\b(easy to (put|get|slip|pull) on|slip(s)? (right )?on|no struggle|effortless|slides? on|wide opening)\b/i,
  stays_up: /\b(stay(s)? up|don't fall|don't slide|stay(s)? in place|don't bunch|don't roll)\b/i,
  style: /\b(pattern|color|colorful|design|cute|pretty|beautiful|stylish|fashion|look(s)? (good|great|nice)|trendy|vibrant|compliment|attractive)\b/i,
  warmth: /\b(warm|thermal|heat|keeps? (my )?feet warm)\b/i,
  fit: /\b(fit(s)?|perfect fit|true to size|fits? great|fits? (my|perfectly)|snug)\b/i,
  quality: /\b(quality|durable|durability|well made|last(s)?|hold(s)? up|well constructed|premium|substantial)\b/i,
  breathable: /\b(breathab|moisture|wicking|keeps? (my )?feet dry|not sweaty|ventilat)\b/i,
  not_medical_looking: /\b(don't look (like )?medical|doesn't look (like )?compress|not ugly|doesn't scream|no one can tell|wouldn't know)\b/i,
};

const TRANSFORMATION_PATTERNS = {
  game_changer: /game.?changer/i,
  finally: /\bfinally\b/i,
  no_more: /no more/i,
  love: /\blove\b/i,
  best_ever: /best (socks?|I've|I have|pair) ever/i,
  life_changing: /life.?chang|changed my life/i,
  wish_found_sooner: /wish.*(found|knew|tried|bought|discovered).*(sooner|earlier|before|years ago)/i,
  miracle: /\b(miracle|godsend|god.?send|blessing|saved my|saved me)\b/i,
  never_going_back: /\b(never going back|won't go back|never buy another|only (socks?|brand|ones?))\b/i,
  cant_live_without: /\b(can't live without|can't do without|essential|necessity|must.?have)\b/i,
  percent_improvement: /\d+%\s*(less|more|better|reduction|improvement)/i,
};

const SEGMENT_LAYER = {};
for (const key of Object.keys(IDENTITY_SEGMENT_PATTERNS)) SEGMENT_LAYER[key] = 'identity';
for (const key of Object.keys(MOTIVATION_SEGMENT_PATTERNS)) SEGMENT_LAYER[key] = 'motivation';


// ─── Utility helpers ─────────────────────────────────────────────────────────

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }
function pct(part, total) { return total > 0 ? round1((part / total) * 100) : 0; }

function log(msg) { process.stdout.write(`[${new Date().toISOString().slice(11, 19)}] ${msg}\n`); }

/** Map a Shopify "Product type" string to our product category */
function mapProductType(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^"|"$/g, '').trim();
  if (!cleaned) return null;
  return PRODUCT_TYPE_MAP[cleaned] || 'Other';
}

/** Normalize email for consistent matching */
function normalizeEmail(email) {
  if (!email) return null;
  const cleaned = email.replace(/^"|"$/g, '').trim().toLowerCase();
  return cleaned || null;
}

/**
 * Stream-parse a CSV file using PapaParse.
 * Calls onRow(row) for each row, then onComplete().
 */
function streamCSV(filePath, onRow) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      step(results) {
        count++;
        if (count % 500000 === 0) log(`  ... ${(count / 1000000).toFixed(1)}M rows processed`);
        onRow(results.data);
      },
      complete() {
        log(`  Finished: ${count.toLocaleString()} rows`);
        resolve(count);
      },
      error(err) { reject(err); },
    });
  });
}

/** Load an entire CSV into memory (for smaller files like reviews) */
function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0) {
      log(`  Warning: ${result.errors.length} parse errors in ${path.basename(filePath)}`);
    }
    resolve(result.data);
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: Process Orders — stream through all 3.5M rows
// ═══════════════════════════════════════════════════════════════════════════════

async function processOrders(filePath) {
  log('STEP 1: Processing orders...');

  // Per-customer accumulator
  const customers = new Map();
  // key: email → { totalSpend, totalOrders, productCategories: Set, productSpend: {}, discountCodes: Set, orderDates: [] }

  let totalRows = 0;
  let skippedRows = 0;
  let totalRevenue = 0;
  let totalOrderLines = 0;

  await streamCSV(filePath, (row) => {
    totalRows++;
    const email = normalizeEmail(row['Customer email']);
    const productType = row['Product title'] ? mapProductType(row['Product type']) : null;
    const qty = parseInt(row['Quantity ordered'] || '0', 10);
    const netSales = parseFloat(row['Net sales'] || '0');
    const totalSales = parseFloat(row['Total sales'] || '0');
    const day = row['Day'] || '';
    const discount = (row['Discount code'] || '').replace(/^"|"$/g, '').trim();

    // Skip rows with no email or no product (shipping charges, adjustments)
    if (!email || !productType || qty <= 0) {
      skippedRows++;
      return;
    }

    totalRevenue += netSales;
    totalOrderLines++;

    let cust = customers.get(email);
    if (!cust) {
      cust = {
        totalNetSales: 0,
        totalGrossSales: 0,
        orderLineCount: 0,
        productCategories: new Set(),
        productSpend: {},    // category → net revenue
        productQty: {},      // category → quantity
        discountCodes: new Set(),
        earliestDate: day,
        latestDate: day,
      };
      customers.set(email, cust);
    }

    cust.totalNetSales += netSales;
    cust.totalGrossSales += totalSales;
    cust.orderLineCount++;
    cust.productCategories.add(productType);
    cust.productSpend[productType] = (cust.productSpend[productType] || 0) + netSales;
    cust.productQty[productType] = (cust.productQty[productType] || 0) + qty;
    if (discount) cust.discountCodes.add(discount);
    if (day < cust.earliestDate) cust.earliestDate = day;
    if (day > cust.latestDate) cust.latestDate = day;
  });

  log(`  Total rows: ${totalRows.toLocaleString()}`);
  log(`  Skipped (no email/product/qty): ${skippedRows.toLocaleString()}`);
  log(`  Valid order lines: ${totalOrderLines.toLocaleString()}`);
  log(`  Unique customers with orders: ${customers.size.toLocaleString()}`);
  log(`  Total net revenue: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

  return { customers, totalRevenue, totalOrderLines };
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: Process Customer profiles — stream through 1M rows
// ═══════════════════════════════════════════════════════════════════════════════

async function processCustomerProfiles(filePath) {
  log('STEP 2: Processing customer profiles...');

  // Aggregate by email: sum orders, sales; keep most recent location
  const profiles = new Map();

  await streamCSV(filePath, (row) => {
    const email = normalizeEmail(row['Customer email']);
    if (!email) return;

    const city = (row['Shipping city'] || '').replace(/^"|"$/g, '').trim();
    const region = (row['Shipping region'] || '').replace(/^"|"$/g, '').trim();
    const country = (row['Shipping country'] || '').replace(/^"|"$/g, '').trim();
    const firstOrderDate = (row['Customer first order date'] || '').replace(/^"|"$/g, '').trim();
    const netSales = parseFloat(row['Net sales'] || '0');
    const totalSales = parseFloat(row['Total sales'] || '0');
    const orders = parseInt(row['Orders'] || '0', 10);
    const day = (row['Day'] || '').replace(/^"|"$/g, '').trim();

    let prof = profiles.get(email);
    if (!prof) {
      prof = {
        firstOrderDate,
        city,
        region,
        country,
        totalNetSales: 0,
        totalGrossSales: 0,
        totalOrders: 0,
        latestDay: day,
      };
      profiles.set(email, prof);
    }

    prof.totalNetSales += netSales;
    prof.totalGrossSales += totalSales;
    prof.totalOrders += orders;
    // Keep the most recent location (latest day)
    if (day > prof.latestDay) {
      prof.latestDay = day;
      if (city) prof.city = city;
      if (region) prof.region = region;
      if (country) prof.country = country;
    }
  });

  log(`  Unique customer profiles: ${profiles.size.toLocaleString()}`);
  return profiles;
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: Process Reviews — load, tag, and link to customers
// ═══════════════════════════════════════════════════════════════════════════════

async function processReviews(reviewFiles) {
  log('STEP 3: Processing reviews...');

  const allReviews = [];

  for (const { filePath, productCategory } of reviewFiles) {
    log(`  Loading ${path.basename(filePath)}...`);
    const rows = await loadCSV(filePath);
    log(`    ${rows.length.toLocaleString()} reviews loaded`);

    for (const row of rows) {
      const reviewText = (row['Review'] || '').trim();
      if (!reviewText) continue; // skip empty reviews

      const email = normalizeEmail(row['Email']);
      const rating = parseInt(row['Rating'] || '0', 10);
      const date = (row['Date'] || '').trim();
      const name = (row['Full Name'] || row['Nickname'] || '').trim();
      const verified = (row['Verified'] || '').trim().toUpperCase() === 'TRUE';
      const productHandle = (row['Product Handle'] || '').trim();
      const variant = (row['Variant'] || '').trim();

      // Tag with all matching segments
      const matchedSegments = [];
      for (const [segName, pattern] of Object.entries(ALL_SEGMENT_PATTERNS)) {
        if (pattern.test(reviewText)) {
          matchedSegments.push(segName);
        }
      }

      // Tag with pain/benefit/transformation patterns
      const matchedPains = [];
      for (const [name, pattern] of Object.entries(PAIN_PATTERNS)) {
        if (pattern.test(reviewText)) matchedPains.push(name);
      }
      const matchedBenefits = [];
      for (const [name, pattern] of Object.entries(BENEFIT_PATTERNS)) {
        if (pattern.test(reviewText)) matchedBenefits.push(name);
      }
      const matchedTransformations = [];
      for (const [name, pattern] of Object.entries(TRANSFORMATION_PATTERNS)) {
        if (pattern.test(reviewText)) matchedTransformations.push(name);
      }

      allReviews.push({
        email,
        reviewText,
        rating,
        date,
        name,
        verified,
        productHandle,
        variant,
        product: productCategory,
        matchedSegments,
        matchedPains,
        matchedBenefits,
        matchedTransformations,
      });
    }
  }

  log(`  Total reviews tagged: ${allReviews.length.toLocaleString()}`);

  // Stats
  const withEmail = allReviews.filter(r => r.email).length;
  const withSegments = allReviews.filter(r => r.matchedSegments.length > 0).length;
  log(`  Reviews with email: ${withEmail.toLocaleString()} (${pct(withEmail, allReviews.length)}%)`);
  log(`  Reviews matching segments: ${withSegments.toLocaleString()} (${pct(withSegments, allReviews.length)}%)`);

  return allReviews;
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: Compute enriched segment data
// ═══════════════════════════════════════════════════════════════════════════════

function computeEnrichedSegments(reviews, orderCustomers, customerProfiles) {
  log('STEP 4: Computing enriched segment data...');

  const totalReviews = reviews.length;
  const segments = {};

  // Group reviews by segment
  const segmentReviews = new Map(); // segName → [review, ...]
  let unsegmented = 0;
  let multiSegment = 0;

  for (const review of reviews) {
    if (review.matchedSegments.length === 0) unsegmented++;
    if (review.matchedSegments.length > 1) multiSegment++;
    for (const seg of review.matchedSegments) {
      if (!segmentReviews.has(seg)) segmentReviews.set(seg, []);
      segmentReviews.get(seg).push(review);
    }
  }

  for (const [segName, revs] of segmentReviews.entries()) {
    const displayName = segName.replace(/_/g, ' ');
    const layer = SEGMENT_LAYER[segName] || 'motivation';

    // ── Review-based metrics (same as current app) ──
    const ratings = revs.map(r => r.rating).filter(r => r > 0);
    const avgRating = ratings.length > 0
      ? round2(ratings.reduce((a, b) => a + b, 0) / ratings.length)
      : 0;
    const fiveStarPct = ratings.length > 0
      ? round1(ratings.filter(r => r === 5).length / ratings.length * 100)
      : 0;

    // Per-product breakdown
    const byProduct = {};
    const productCounts = {};
    for (const r of revs) {
      productCounts[r.product] = (productCounts[r.product] || 0) + 1;
    }
    for (const [prod, count] of Object.entries(productCounts)) {
      byProduct[prod] = { reviewCount: count, reviewPct: pct(count, revs.length) };
    }

    // Top patterns
    const topPains = computeTopPatterns(revs, 'matchedPains', PAIN_PATTERNS, 5);
    const topBenefits = computeTopPatterns(revs, 'matchedBenefits', BENEFIT_PATTERNS, 5);
    const topTransformations = computeTopPatterns(revs, 'matchedTransformations', TRANSFORMATION_PATTERNS, 5);

    // Representative quotes (25 per segment — generous bank)
    const quotes = pickQuotes(revs, 25);

    // ── Sales-enriched metrics (NEW) ──
    // Link reviewers to their purchase history via email
    const reviewerEmails = new Set(revs.filter(r => r.email).map(r => r.email));
    const linkedCustomers = [];

    for (const email of reviewerEmails) {
      const orderData = orderCustomers.get(email);
      const profileData = customerProfiles.get(email);
      if (orderData || profileData) {
        linkedCustomers.push({ email, orderData, profileData });
      }
    }

    // Sales aggregation for linked customers
    let totalRevenue = 0;
    let totalOrderLines = 0;
    let totalGrossRevenue = 0;
    let repeatBuyers = 0;         // ordered on more than one date
    let multiLineBuyers = 0;      // bought from multiple product lines
    let usedDiscountCount = 0;
    const productLineBuyers = {};  // category → count of unique customers
    const comboCounter = {};       // "Cat1+Cat2" → count
    const geoCounter = {};         // country → { customers, revenue }
    const regionCounter = {};      // "Country - Region" → { customers, revenue }

    for (const { email, orderData, profileData } of linkedCustomers) {
      if (orderData) {
        totalRevenue += orderData.totalNetSales;
        totalGrossRevenue += orderData.totalGrossSales;
        totalOrderLines += orderData.orderLineCount;

        // Check if repeat buyer (ordered on different dates)
        if (orderData.earliestDate !== orderData.latestDate) {
          repeatBuyers++;
        }

        // Product lines purchased
        const cats = [...orderData.productCategories].filter(c => c !== 'Other');
        if (cats.length > 1) multiLineBuyers++;
        for (const cat of cats) {
          productLineBuyers[cat] = (productLineBuyers[cat] || 0) + 1;
        }

        // Cross-purchase combos (sorted pairs)
        if (cats.length > 1) {
          const sorted = [...cats].sort();
          for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
              const key = `${sorted[i]}+${sorted[j]}`;
              comboCounter[key] = (comboCounter[key] || 0) + 1;
            }
          }
        }

        // Discount usage
        if (orderData.discountCodes.size > 0) usedDiscountCount++;

        // Revenue per product in this segment
        for (const [cat, spend] of Object.entries(orderData.productSpend)) {
          if (!byProduct[cat]) byProduct[cat] = { reviewCount: 0, reviewPct: 0 };
          byProduct[cat].revenue = (byProduct[cat].revenue || 0) + spend;
        }
      }

      // Geography from customer profile
      if (profileData && profileData.country) {
        const country = profileData.country;
        if (!geoCounter[country]) geoCounter[country] = { customers: 0, revenue: 0 };
        geoCounter[country].customers++;
        geoCounter[country].revenue += (orderData?.totalNetSales || 0);

        const regionKey = `${country} - ${profileData.region || 'Unknown'}`;
        if (!regionCounter[regionKey]) regionCounter[regionKey] = { customers: 0, revenue: 0 };
        regionCounter[regionKey].customers++;
        regionCounter[regionKey].revenue += (orderData?.totalNetSales || 0);
      }
    }

    const linkedCount = linkedCustomers.length;
    const avgLTV = linkedCount > 0 ? round2(totalRevenue / linkedCount) : 0;
    const avgOrderLines = linkedCount > 0 ? round2(totalOrderLines / linkedCount) : 0;
    const avgOrderValue = totalOrderLines > 0 ? round2(totalRevenue / totalOrderLines) : 0;

    // Build geography sorted by customer count
    const geography = Object.entries(geoCounter)
      .map(([country, data]) => ({
        country,
        customers: data.customers,
        pct: pct(data.customers, linkedCount),
        revenue: round2(data.revenue),
      }))
      .sort((a, b) => b.customers - a.customers);

    // Top regions
    const topRegions = Object.entries(regionCounter)
      .map(([region, data]) => ({
        region,
        customers: data.customers,
        pct: pct(data.customers, linkedCount),
        revenue: round2(data.revenue),
      }))
      .sort((a, b) => b.customers - a.customers)
      .slice(0, 15);

    // Cross-purchase combos sorted
    const crossPurchaseCombos = Object.entries(comboCounter)
      .map(([combo, count]) => ({
        combo,
        customers: count,
        pct: pct(count, linkedCount),
      }))
      .sort((a, b) => b.customers - a.customers);

    // Product line penetration
    const productLinePenetration = Object.entries(productLineBuyers)
      .map(([cat, count]) => ({
        category: cat,
        customers: count,
        pct: pct(count, linkedCount),
      }))
      .sort((a, b) => b.customers - a.customers);

    segments[displayName] = {
      layer,
      reviewCount: revs.length,
      reviewPct: pct(revs.length, totalReviews),
      avgRating,
      fiveStarPct,
      byProduct,
      topPains,
      topBenefits,
      topTransformations,
      quotes,

      // Sales enrichment
      sales: {
        linkedReviewers: linkedCount,
        linkRate: pct(linkedCount, reviewerEmails.size),
        totalRevenue: round2(totalRevenue),
        totalGrossRevenue: round2(totalGrossRevenue),
        totalOrderLines,
        uniqueCustomers: linkedCount,
        avgLifetimeValue: avgLTV,
        avgOrderLines: avgOrderLines,
        avgOrderValue: avgOrderValue,
        repeatPurchaseRate: pct(repeatBuyers, linkedCount),
        repeatBuyers,
        crossPurchase: {
          boughtMultipleLines: multiLineBuyers,
          pctBoughtMultiple: pct(multiLineBuyers, linkedCount),
          productLinePenetration,
          combos: crossPurchaseCombos,
        },
        discountUsage: {
          usedDiscount: usedDiscountCount,
          pctUsedDiscount: pct(usedDiscountCount, linkedCount),
        },
        geography,
        topRegions,
      },
    };
  }

  log(`  Segments computed: ${Object.keys(segments).length}`);

  return {
    segments,
    totalReviews,
    unsegmented: { count: unsegmented, pct: pct(unsegmented, totalReviews) },
    multiSegment: { count: multiSegment, pct: pct(multiSegment, totalReviews) },
  };
}

/** Count pattern occurrences from pre-tagged review data */
function computeTopPatterns(reviews, matchedField, patternDefs, topN) {
  const total = reviews.length;
  const counts = {};
  for (const name of Object.keys(patternDefs)) counts[name] = 0;

  for (const r of reviews) {
    for (const name of r[matchedField]) {
      counts[name] = (counts[name] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({
      name: name.replace(/_/g, ' '),
      count,
      pct: pct(count, total),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** Pick representative quotes — prioritize longer, higher-rated, verified reviews */
function pickQuotes(reviews, max) {
  return [...reviews]
    .filter(r => r.reviewText.length >= 50)
    .sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.reviewText.length - a.reviewText.length;
    })
    .slice(0, max)
    .map(r => ({
      text: r.reviewText.length > 400 ? r.reviewText.slice(0, 400) + '...' : r.reviewText,
      rating: r.rating,
      product: r.product,
      verified: r.verified,
    }));
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: Compute cross-segment overlaps with sales enrichment
// ═══════════════════════════════════════════════════════════════════════════════

function computeEnrichedOverlaps(reviews, orderCustomers) {
  log('STEP 5: Computing cross-segment overlaps with sales...');

  const identityKeys = Object.keys(IDENTITY_SEGMENT_PATTERNS);
  const motivationKeys = Object.keys(MOTIVATION_SEGMENT_PATTERNS);

  // Precompute per-segment totals
  const segTotals = {};
  for (const r of reviews) {
    for (const seg of r.matchedSegments) {
      segTotals[seg] = (segTotals[seg] || 0) + 1;
    }
  }

  const overlaps = [];

  for (const idKey of identityKeys) {
    for (const motKey of motivationKeys) {
      // Find reviews matching BOTH
      const matching = reviews.filter(
        r => r.matchedSegments.includes(idKey) && r.matchedSegments.includes(motKey)
      );
      if (matching.length === 0) continue;

      const idTotal = segTotals[idKey] || 1;
      const motTotal = segTotals[motKey] || 1;

      // Product distribution
      const productCounts = {};
      const ratings = [];
      for (const r of matching) {
        productCounts[r.product] = (productCounts[r.product] || 0) + 1;
        if (r.rating > 0) ratings.push(r.rating);
      }
      const byProduct = {};
      for (const [prod, cnt] of Object.entries(productCounts)) {
        byProduct[prod] = { count: cnt, pct: pct(cnt, matching.length) };
      }

      const avgRating = ratings.length > 0
        ? round2(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 0;

      // Sales enrichment for this overlap
      const overlapEmails = new Set(matching.filter(r => r.email).map(r => r.email));
      let overlapRevenue = 0;
      let overlapOrders = 0;
      let overlapLinked = 0;
      let overlapRepeat = 0;
      let overlapMultiLine = 0;

      for (const email of overlapEmails) {
        const orderData = orderCustomers.get(email);
        if (!orderData) continue;
        overlapLinked++;
        overlapRevenue += orderData.totalNetSales;
        overlapOrders += orderData.orderLineCount;
        if (orderData.earliestDate !== orderData.latestDate) overlapRepeat++;
        const cats = [...orderData.productCategories].filter(c => c !== 'Other');
        if (cats.length > 1) overlapMultiLine++;
      }

      overlaps.push({
        identity: idKey.replace(/_/g, ' '),
        motivation: motKey.replace(/_/g, ' '),
        reviewCount: matching.length,
        percentOfIdentity: pct(matching.length, idTotal),
        percentOfMotivation: pct(matching.length, motTotal),
        avgRating,
        byProduct,
        sales: {
          linkedReviewers: overlapLinked,
          totalRevenue: round2(overlapRevenue),
          totalOrderLines: overlapOrders,
          avgLifetimeValue: overlapLinked > 0 ? round2(overlapRevenue / overlapLinked) : 0,
          avgOrders: overlapLinked > 0 ? round2(overlapOrders / overlapLinked) : 0,
          repeatPurchaseRate: pct(overlapRepeat, overlapLinked),
          crossPurchaseRate: pct(overlapMultiLine, overlapLinked),
        },
      });
    }
  }

  overlaps.sort((a, b) => b.reviewCount - a.reviewCount);
  log(`  Cross-segment overlaps: ${overlaps.length}`);
  return overlaps;
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: Product affinity with revenue
// ═══════════════════════════════════════════════════════════════════════════════

function computeEnrichedProductAffinity(reviews, segmentData, orderCustomers) {
  log('STEP 6: Computing product affinity with revenue...');

  const products = ['EasyStretch', 'Compression', 'Ankle Compression'];
  const totalReviews = reviews.length;
  const affinity = {};

  for (const product of products) {
    const productReviews = reviews.filter(r => r.product === product);
    const productTotal = productReviews.length;
    if (productTotal === 0) continue;

    const entries = [];
    for (const [segName, segInfo] of Object.entries(segmentData.segments)) {
      const segKey = segName.replace(/ /g, '_');
      const productData = segInfo.byProduct[product];
      const segCountInProduct = productData?.reviewCount || 0;
      if (segCountInProduct === 0) continue;

      const shareOfProduct = pct(segCountInProduct, productTotal);
      const overallShare = totalReviews > 0 ? segInfo.reviewCount / totalReviews : 0;
      const concentrationIndex = overallShare > 0
        ? round2((segCountInProduct / productTotal) / overallShare)
        : 0;

      // Revenue for this segment in this product
      const productRevenue = productData?.revenue || 0;
      const segTotalRevenue = segInfo.sales?.totalRevenue || 0;
      const revenueShare = segTotalRevenue > 0 ? pct(productRevenue, segTotalRevenue) : 0;

      entries.push({
        segmentName: segName,
        layer: segInfo.layer,
        reviewCount: segCountInProduct,
        shareOfProduct,
        concentrationIndex,
        revenue: round2(productRevenue),
        revenueShare,
      });
    }

    entries.sort((a, b) => b.shareOfProduct - a.shareOfProduct);
    affinity[product] = entries;
  }

  return affinity;
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7: Global cross-purchase matrix
// ═══════════════════════════════════════════════════════════════════════════════

function computeCrossPurchaseMatrix(orderCustomers) {
  log('STEP 7: Computing global cross-purchase matrix...');

  const products = ['EasyStretch', 'Compression', 'Ankle Compression'];
  const matrix = {};
  let totalCustomers = 0;

  // Count customers per product and per combo
  const productCustomerCount = {};
  const comboCount = {};

  for (const [, data] of orderCustomers) {
    totalCustomers++;
    const cats = [...data.productCategories].filter(c => c !== 'Other');

    for (const cat of cats) {
      productCustomerCount[cat] = (productCustomerCount[cat] || 0) + 1;
    }

    if (cats.length > 1) {
      const sorted = [...cats].sort();
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const key = `${sorted[i]}+${sorted[j]}`;
          if (!comboCount[key]) comboCount[key] = { customers: 0, totalSpend: 0 };
          comboCount[key].customers++;
          comboCount[key].totalSpend += data.totalNetSales;
        }
      }
      // Triple combo
      if (cats.length >= 3) {
        const key = sorted.join('+');
        if (!comboCount[key]) comboCount[key] = { customers: 0, totalSpend: 0 };
        comboCount[key].customers++;
        comboCount[key].totalSpend += data.totalNetSales;
      }
    }
  }

  // Product ownership
  matrix.totalCustomers = totalCustomers;
  matrix.productOwnership = {};
  for (const [cat, count] of Object.entries(productCustomerCount)) {
    matrix.productOwnership[cat] = {
      customers: count,
      pct: pct(count, totalCustomers),
    };
  }

  // Cross-purchase combos
  matrix.combos = Object.entries(comboCount)
    .map(([combo, data]) => ({
      combo,
      customers: data.customers,
      pctOfTotal: pct(data.customers, totalCustomers),
      avgCombinedSpend: round2(data.totalSpend / data.customers),
    }))
    .sort((a, b) => b.customers - a.customers);

  log(`  Total customers: ${totalCustomers.toLocaleString()}`);
  log(`  Cross-purchase combos: ${matrix.combos.length}`);

  return matrix;
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP 8: Customer journey examples
// ═══════════════════════════════════════════════════════════════════════════════

function computeCustomerJourneys(reviews, orderCustomers, customerProfiles) {
  log('STEP 8: Computing customer journey examples...');

  // For each segment, find the top 5 highest-spending reviewers
  const segmentReviewers = new Map(); // segName → Map<email, { reviews, orderData }>

  for (const review of reviews) {
    if (!review.email) continue;
    for (const seg of review.matchedSegments) {
      const displayName = seg.replace(/_/g, ' ');
      if (!segmentReviewers.has(displayName)) segmentReviewers.set(displayName, new Map());
      const segMap = segmentReviewers.get(displayName);
      if (!segMap.has(review.email)) {
        segMap.set(review.email, { reviews: [], orderData: orderCustomers.get(review.email) });
      }
      segMap.get(review.email).reviews.push(review);
    }
  }

  const journeys = {};

  for (const [segName, reviewerMap] of segmentReviewers.entries()) {
    // Sort by total spend, pick top 5
    const sorted = [...reviewerMap.entries()]
      .filter(([, data]) => data.orderData)
      .sort((a, b) => (b[1].orderData?.totalNetSales || 0) - (a[1].orderData?.totalNetSales || 0))
      .slice(0, 5);

    journeys[segName] = sorted.map(([email, data]) => {
      const od = data.orderData;
      const profile = customerProfiles.get(email);
      const bestReview = data.reviews
        .sort((a, b) => b.reviewText.length - a.reviewText.length)[0];

      return {
        // Anonymize: show first 3 chars + domain
        emailHint: email.slice(0, 3) + '***@' + email.split('@')[1],
        totalSpend: round2(od.totalNetSales),
        orderLines: od.orderLineCount,
        productsOwned: [...od.productCategories].filter(c => c !== 'Other'),
        firstOrder: od.earliestDate,
        lastOrder: od.latestDate,
        location: profile ? `${profile.city || ''}, ${profile.region || ''}, ${profile.country || ''}`.replace(/^, |, $/g, '') : null,
        sampleQuote: bestReview
          ? (bestReview.reviewText.length > 300
              ? bestReview.reviewText.slice(0, 300) + '...'
              : bestReview.reviewText)
          : null,
        reviewCount: data.reviews.length,
        reviewProducts: [...new Set(data.reviews.map(r => r.product))],
      };
    });
  }

  const totalJourneys = Object.values(journeys).reduce((sum, arr) => sum + arr.length, 0);
  log(`  Customer journeys: ${totalJourneys} across ${Object.keys(journeys).length} segments`);

  return journeys;
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  log('═══════════════════════════════════════════════════════════════');
  log('  VIASOX SALES DATA PREPROCESSOR');
  log('═══════════════════════════════════════════════════════════════');
  log('');

  // Find input files
  const files = fs.readdirSync(DATA_DIR);
  const ordersFile = files.find(f => f.startsWith('Orders'));
  const customerFile = files.find(f => f.startsWith('Customer'));
  const reviewFiles = files.filter(f => f.startsWith('Viasox Reviews'));

  if (!ordersFile) throw new Error(`No Orders CSV found in ${DATA_DIR}`);
  if (!customerFile) throw new Error(`No Customer CSV found in ${DATA_DIR}`);
  if (reviewFiles.length === 0) throw new Error(`No Review CSVs found in ${DATA_DIR}`);

  log(`Data directory: ${DATA_DIR}`);
  log(`Orders file: ${ordersFile}`);
  log(`Customer file: ${customerFile}`);
  log(`Review files: ${reviewFiles.join(', ')}`);
  log('');

  // Determine product category from review file name
  const reviewInputs = reviewFiles.map(f => {
    let category = 'Other';
    const lower = f.toLowerCase();
    if (lower.includes('easystretch') || lower.includes('easy stretch')) category = 'EasyStretch';
    else if (lower.includes('ankle compression')) category = 'Ankle Compression';
    else if (lower.includes('compression')) category = 'Compression';
    return { filePath: path.join(DATA_DIR, f), productCategory: category };
  });

  // STEP 1: Process orders
  const { customers: orderCustomers, totalRevenue, totalOrderLines } =
    await processOrders(path.join(DATA_DIR, ordersFile));
  log('');

  // STEP 2: Process customer profiles
  const customerProfiles = await processCustomerProfiles(path.join(DATA_DIR, customerFile));
  log('');

  // STEP 3: Process and tag reviews
  const reviews = await processReviews(reviewInputs);
  log('');

  // Link stats
  const reviewEmails = new Set(reviews.filter(r => r.email).map(r => r.email));
  let linkedToOrders = 0;
  for (const email of reviewEmails) {
    if (orderCustomers.has(email)) linkedToOrders++;
  }
  log(`Link rate: ${linkedToOrders.toLocaleString()} of ${reviewEmails.size.toLocaleString()} reviewers found in orders (${pct(linkedToOrders, reviewEmails.size)}%)`);
  log('');

  // STEP 4: Compute enriched segments
  const segmentData = computeEnrichedSegments(reviews, orderCustomers, customerProfiles);
  log('');

  // STEP 5: Cross-segment overlaps with sales
  const crossSegmentOverlaps = computeEnrichedOverlaps(reviews, orderCustomers);
  log('');

  // STEP 6: Product affinity with revenue
  const productAffinity = computeEnrichedProductAffinity(reviews, segmentData, orderCustomers);
  log('');

  // STEP 7: Global cross-purchase matrix
  const crossPurchaseMatrix = computeCrossPurchaseMatrix(orderCustomers);
  log('');

  // STEP 8: Customer journey examples
  const customerJourneys = computeCustomerJourneys(reviews, orderCustomers, customerProfiles);
  log('');

  // ── Assemble final output ──
  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      dataDir: DATA_DIR,
      ordersFile,
      customerFile,
      reviewFiles,
      dateRange: {
        orders: ordersFile.match(/(\d{4}-\d{2}-\d{2})/g) || [],
      },
      totalReviews: reviews.length,
      totalOrderLines,
      totalRevenue: round2(totalRevenue),
      totalCustomersInOrders: orderCustomers.size,
      totalCustomerProfiles: customerProfiles.size,
      uniqueReviewerEmails: reviewEmails.size,
      reviewersLinkedToOrders: linkedToOrders,
      linkRate: pct(linkedToOrders, reviewEmails.size),
    },

    // Full segment data with sales enrichment
    segments: segmentData.segments,
    segmentMeta: {
      totalReviews: segmentData.totalReviews,
      unsegmented: segmentData.unsegmented,
      multiSegment: segmentData.multiSegment,
    },

    // Cross-segment overlaps (identity × motivation) with sales
    crossSegmentOverlaps,

    // Product affinity with revenue data
    productAffinity,

    // Global cross-purchase matrix (not segment-specific)
    crossPurchaseMatrix,

    // Top customer journey examples per segment
    customerJourneys,
  };

  // Write output
  const json = JSON.stringify(output, null, 2);
  fs.writeFileSync(OUTPUT_PATH, json, 'utf8');
  const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(1);
  log('═══════════════════════════════════════════════════════════════');
  log(`  OUTPUT: ${OUTPUT_PATH}`);
  log(`  SIZE:   ${sizeMB} MB`);
  log(`  SEGMENTS: ${Object.keys(segmentData.segments).length}`);
  log(`  OVERLAPS: ${crossSegmentOverlaps.length}`);
  log(`  JOURNEYS: ${Object.values(customerJourneys).reduce((s, a) => s + a.length, 0)}`);
  log('═══════════════════════════════════════════════════════════════');
  log('Done.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
