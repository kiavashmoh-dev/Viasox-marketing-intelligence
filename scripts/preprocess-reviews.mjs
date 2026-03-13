#!/usr/bin/env node
/**
 * preprocess-reviews.mjs
 *
 * Reads the 3 Viasox review CSVs (EasyStretch, Compression, Ankle Compression),
 * runs the same deterministic analysis pipeline used at runtime
 * (pattern matching + two-layer segmentation), and writes the result as
 * src/data/reviewAnalysis.json — which is then statically imported at build time.
 *
 * Usage:
 *   node scripts/preprocess-reviews.mjs
 *
 * Data source:
 *   ../VSX Intelligence CSV Data Files/Viasox Reviews W Email - *.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(PROJECT_ROOT, '..', 'VSX Intelligence CSV Data Files');
const OUTPUT_PATH = path.resolve(PROJECT_ROOT, 'src', 'data', 'reviewAnalysis.json');

// ─── CSV Files ──────────────────────────────────────────────────────────────

const CSV_FILES = [
  { file: 'Viasox Reviews W Email - EasyStretch.csv', product: 'EasyStretch' },
  { file: 'Viasox Reviews W Email - Compression.csv', product: 'Compression' },
  { file: 'Viasox Reviews W Email - Ankle Compression.csv', product: 'Ankle Compression' },
];

// ─── Patterns (replicated from src/engine/patterns.ts) ──────────────────────

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

const SEGMENT_LAYERS = new Map();
for (const key of Object.keys(IDENTITY_SEGMENT_PATTERNS)) SEGMENT_LAYERS.set(key, 'identity');
for (const key of Object.keys(MOTIVATION_SEGMENT_PATTERNS)) SEGMENT_LAYERS.set(key, 'motivation');

const TRANSFORMATION_STORY_PATTERN =
  /\b(before|used to|finally|no more|now I|changed my|game.?changer|life.?chang|gave me|for the first time)\b/i;

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadCsv(filePath) {
  console.log(`  Loading ${path.basename(filePath)}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });
  return data;
}

function extractQuotes(matches, maxQuotes = 5, minLength = 50) {
  const quotes = [];
  for (const row of matches) {
    const review = row.review;
    if (review.length >= minLength && quotes.length < maxQuotes) {
      quotes.push(review.length > 300 ? review.slice(0, 300) + '...' : review);
    }
  }
  return quotes;
}

function analyzeCategory(reviews, patterns) {
  const total = reviews.length;
  const results = {};
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = reviews.filter((r) => pattern.test(r.review));
    const count = matches.length;
    const percentage = total > 0 ? Math.round(((count / total) * 100) * 100) / 100 : 0;
    const quotes = extractQuotes(matches);
    results[name] = { count, percentage, quotes };
  }
  return results;
}

function findTransformationStories(reviews, minLength = 100) {
  const stories = [];
  const beforeAfter = reviews.filter((r) => TRANSFORMATION_STORY_PATTERN.test(r.review));
  for (const row of beforeAfter) {
    const review = row.review;
    if (review.length >= minLength) {
      stories.push({
        review: review.length > 500 ? review.slice(0, 500) + '...' : review,
        rating: row.rating ?? 'N/A',
        date: row.date ?? 'N/A',
      });
      if (stories.length >= 20) break;
    }
  }
  return stories;
}

function analyzeProduct(reviews, productName) {
  const total = reviews.length;
  const ratings = reviews.map((r) => r.rating).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const fiveStar = ratings.filter((r) => r === 5).length;
  const oneStar = ratings.filter((r) => r === 1).length;

  return {
    productName,
    totalReviews: total,
    averageRating: Math.round(avgRating * 100) / 100,
    fiveStarPercent: ratings.length > 0 ? Math.round(((fiveStar / ratings.length) * 100) * 10) / 10 : 0,
    oneStarPercent: ratings.length > 0 ? Math.round(((oneStar / ratings.length) * 100) * 10) / 10 : 0,
    pain: analyzeCategory(reviews, PAIN_PATTERNS),
    benefits: analyzeCategory(reviews, BENEFIT_PATTERNS),
    transformation: analyzeCategory(reviews, TRANSFORMATION_PATTERNS),
    segments: analyzeCategory(reviews, { ...IDENTITY_SEGMENT_PATTERNS, ...MOTIVATION_SEGMENT_PATTERNS }),
    transformationStories: findTransformationStories(reviews),
  };
}

// ─── Segment Engine (replicates segmentEngine.ts) ───────────────────────────

function tagAllReviews(organized) {
  const tagged = [];
  for (const [product, reviews] of Object.entries(organized)) {
    if (product === 'Other') continue;
    for (const review of reviews) {
      const matchedSegments = [];
      for (const [segName, pattern] of Object.entries(ALL_SEGMENT_PATTERNS)) {
        if (pattern.test(review.review)) matchedSegments.push(segName);
      }
      tagged.push({ ...review, product, matchedSegments });
    }
  }
  return tagged;
}

function computeTopPatterns(reviews, patterns, topN = 5) {
  const total = reviews.length;
  const results = [];
  for (const [name, pattern] of Object.entries(patterns)) {
    const count = reviews.filter((r) => pattern.test(r.review)).length;
    if (count > 0) {
      results.push({
        name: name.replace(/_/g, ' '),
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      });
    }
  }
  return results.sort((a, b) => b.count - a.count).slice(0, topN);
}

function pickQuotes(reviews, max = 5) {
  const sorted = [...reviews]
    .filter((r) => r.review.length >= 60)
    .sort((a, b) => {
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.review.length - a.review.length;
    });
  return sorted.slice(0, max).map((r) =>
    r.review.length > 300 ? r.review.slice(0, 300) + '...' : r.review,
  );
}

function computeCrossSegmentOverlaps(tagged) {
  const identityKeys = Object.keys(IDENTITY_SEGMENT_PATTERNS);
  const motivationKeys = Object.keys(MOTIVATION_SEGMENT_PATTERNS);

  const identityTotals = new Map();
  const motivationTotals = new Map();
  for (const review of tagged) {
    for (const seg of review.matchedSegments) {
      if (SEGMENT_LAYERS.get(seg) === 'identity') {
        identityTotals.set(seg, (identityTotals.get(seg) ?? 0) + 1);
      } else {
        motivationTotals.set(seg, (motivationTotals.get(seg) ?? 0) + 1);
      }
    }
  }

  const overlaps = [];
  for (const idKey of identityKeys) {
    for (const motKey of motivationKeys) {
      const matching = tagged.filter(
        (r) => r.matchedSegments.includes(idKey) && r.matchedSegments.includes(motKey),
      );
      if (matching.length === 0) continue;

      const idTotal = identityTotals.get(idKey) ?? 1;
      const motTotal = motivationTotals.get(motKey) ?? 1;

      const productCounts = new Map();
      const ratings = [];
      for (const r of matching) {
        productCounts.set(r.product, (productCounts.get(r.product) ?? 0) + 1);
        if (r.rating > 0) ratings.push(r.rating);
      }
      const byProduct = {};
      for (const [prod, cnt] of productCounts.entries()) {
        byProduct[prod] = {
          count: cnt,
          percentage: Math.round((cnt / matching.length) * 1000) / 10,
        };
      }

      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
        : 0;

      overlaps.push({
        identity: idKey.replace(/_/g, ' '),
        motivation: motKey.replace(/_/g, ' '),
        reviewCount: matching.length,
        percentOfIdentity: Math.round((matching.length / idTotal) * 1000) / 10,
        percentOfMotivation: Math.round((matching.length / motTotal) * 1000) / 10,
        avgRating,
        byProduct,
      });
    }
  }
  return overlaps.sort((a, b) => b.reviewCount - a.reviewCount);
}

function computeProductAffinity(tagged, segments, totalReviews) {
  const products = ['EasyStretch', 'Compression', 'Ankle Compression'];
  const affinityMap = {};

  for (const product of products) {
    const productReviews = tagged.filter((r) => r.product === product);
    const productTotal = productReviews.length;
    if (productTotal === 0) continue;

    const entries = [];
    for (const seg of segments) {
      const productData = seg.byProduct[product];
      const segCountInProduct = productData?.count ?? 0;
      if (segCountInProduct === 0) continue;

      const shareOfProduct = Math.round((segCountInProduct / productTotal) * 1000) / 10;
      const overallShare = totalReviews > 0 ? seg.totalReviews / totalReviews : 0;
      const concentrationIndex = overallShare > 0
        ? Math.round(((segCountInProduct / productTotal) / overallShare) * 100) / 100
        : 0;

      entries.push({
        segmentName: seg.segmentName,
        layer: seg.layer,
        count: segCountInProduct,
        shareOfProduct,
        concentrationIndex,
      });
    }
    entries.sort((a, b) => b.shareOfProduct - a.shareOfProduct);
    affinityMap[product] = entries;
  }
  return affinityMap;
}

function buildSegmentBreakdown(organized) {
  const tagged = tagAllReviews(organized);
  const totalReviews = tagged.length;

  const segmentMap = new Map();
  let unsegmentedCount = 0;
  let multiSegmentCount = 0;

  for (const review of tagged) {
    if (review.matchedSegments.length === 0) unsegmentedCount++;
    if (review.matchedSegments.length > 1) multiSegmentCount++;
    for (const seg of review.matchedSegments) {
      if (!segmentMap.has(seg)) segmentMap.set(seg, []);
      segmentMap.get(seg).push(review);
    }
  }

  const segments = [];
  for (const [segName, reviews] of segmentMap.entries()) {
    const byProduct = {};
    const productCounts = new Map();
    for (const r of reviews) {
      productCounts.set(r.product, (productCounts.get(r.product) ?? 0) + 1);
    }
    for (const [product, count] of productCounts.entries()) {
      byProduct[product] = {
        count,
        percentage: Math.round((count / reviews.length) * 1000) / 10,
      };
    }

    const ratings = reviews.map((r) => r.rating).filter((r) => r > 0);
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
      : 0;
    const fiveStar = ratings.filter((r) => r === 5).length;

    segments.push({
      segmentName: segName.replace(/_/g, ' '),
      layer: SEGMENT_LAYERS.get(segName) ?? 'motivation',
      totalReviews: reviews.length,
      percentage: totalReviews > 0 ? Math.round((reviews.length / totalReviews) * 1000) / 10 : 0,
      byProduct,
      topBenefits: computeTopPatterns(reviews, BENEFIT_PATTERNS),
      topPains: computeTopPatterns(reviews, PAIN_PATTERNS),
      topTransformations: computeTopPatterns(reviews, TRANSFORMATION_PATTERNS),
      averageRating: avgRating,
      fiveStarPercent: ratings.length > 0 ? Math.round((fiveStar / ratings.length) * 1000) / 10 : 0,
      representativeQuotes: pickQuotes(reviews),
    });
  }

  segments.sort((a, b) => {
    if (a.layer !== b.layer) return a.layer === 'motivation' ? -1 : 1;
    return b.totalReviews - a.totalReviews;
  });

  const crossSegmentOverlap = computeCrossSegmentOverlaps(tagged);
  const productAffinity = computeProductAffinity(tagged, segments, totalReviews);

  return {
    totalReviews,
    segments,
    unsegmented: {
      count: unsegmentedCount,
      percentage: totalReviews > 0 ? Math.round((unsegmentedCount / totalReviews) * 1000) / 10 : 0,
    },
    multiSegment: {
      count: multiSegmentCount,
      percentage: totalReviews > 0 ? Math.round((multiSegmentCount / totalReviews) * 1000) / 10 : 0,
    },
    crossSegmentOverlap,
    productAffinity,
  };
}

// ─── Yearly Trends ──────────────────────────────────────────────────────────

function buildYearlyTrends(organized) {
  const productNames = ['EasyStretch', 'Compression', 'Ankle Compression'];
  const allYears = new Set();
  const byProduct = {};
  const overallBuckets = {};

  for (const product of productNames) {
    const reviews = organized[product];
    if (!reviews || reviews.length === 0) continue;

    const yearBuckets = {};
    for (const r of reviews) {
      const year = (r.date || '').substring(0, 4);
      if (!/^20\d{2}$/.test(year)) continue;
      allYears.add(year);
      if (!yearBuckets[year]) yearBuckets[year] = [];
      yearBuckets[year].push(r);
      if (!overallBuckets[year]) overallBuckets[year] = [];
      overallBuckets[year].push(r);
    }

    const yearlyData = [];
    for (const [year, revs] of Object.entries(yearBuckets)) {
      const ratings = revs.map((r) => r.rating).filter((r) => r > 0);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
        : 0;
      const fiveStar = ratings.filter((r) => r === 5).length;
      const fiveStarPct = ratings.length > 0
        ? Math.round((fiveStar / ratings.length) * 1000) / 10
        : 0;

      // Count segment matches for this year's reviews
      const segments = {};
      for (const rev of revs) {
        for (const [segName, pattern] of Object.entries(ALL_SEGMENT_PATTERNS)) {
          const displayName = segName.replace(/_/g, ' ');
          if (pattern.test(rev.review)) {
            segments[displayName] = (segments[displayName] || 0) + 1;
          }
        }
      }

      yearlyData.push({ year, totalReviews: revs.length, avgRating, fiveStarPct, segments });
    }

    yearlyData.sort((a, b) => a.year.localeCompare(b.year));
    byProduct[product] = yearlyData;
  }

  // Build overall (all products combined)
  const overall = [];
  for (const [year, revs] of Object.entries(overallBuckets)) {
    const ratings = revs.map((r) => r.rating).filter((r) => r > 0);
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
      : 0;
    const fiveStar = ratings.filter((r) => r === 5).length;
    const fiveStarPct = ratings.length > 0
      ? Math.round((fiveStar / ratings.length) * 1000) / 10
      : 0;

    const segments = {};
    for (const rev of revs) {
      for (const [segName, pattern] of Object.entries(ALL_SEGMENT_PATTERNS)) {
        const displayName = segName.replace(/_/g, ' ');
        if (pattern.test(rev.review)) {
          segments[displayName] = (segments[displayName] || 0) + 1;
        }
      }
    }

    overall.push({ year, totalReviews: revs.length, avgRating, fiveStarPct, segments });
  }
  overall.sort((a, b) => a.year.localeCompare(b.year));

  const years = [...allYears].sort();
  return { years, byProduct, overall };
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('=== Viasox Review Analysis Preprocessor ===\n');

  // 1. Load all review CSVs
  const organized = {
    EasyStretch: [],
    Compression: [],
    'Ankle Compression': [],
    Other: [],
  };

  let totalLoaded = 0;

  for (const { file, product } of CSV_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`  ERROR: File not found: ${filePath}`);
      process.exit(1);
    }

    const rows = loadCsv(filePath);
    let loaded = 0;

    for (const row of rows) {
      const review = (row['Review'] || '').trim();
      const handle = (row['Product Handle'] || '').trim();
      const ratingStr = (row['Rating'] || '').trim();
      const date = (row['Date'] || '').trim();

      if (!review) continue;

      const rating = parseFloat(ratingStr) || 0;
      organized[product].push({ handle, review, rating, date });
      loaded++;
    }

    console.log(`  ${product}: ${loaded.toLocaleString()} reviews loaded`);
    totalLoaded += loaded;
  }

  console.log(`\nTotal reviews loaded: ${totalLoaded.toLocaleString()}\n`);

  // 2. Run product analysis
  console.log('Running pattern analysis...');
  const products = {};
  for (const [productName, reviews] of Object.entries(organized)) {
    if (productName === 'Other' || reviews.length === 0) continue;
    console.log(`  Analyzing ${productName} (${reviews.length.toLocaleString()} reviews)...`);
    products[productName] = analyzeProduct(reviews, productName);
  }

  // 3. Build segment breakdown
  console.log('\nBuilding segment breakdown...');
  const segmentBreakdown = buildSegmentBreakdown(organized);
  console.log(`  ${segmentBreakdown.segments.length} segments discovered`);
  console.log(`  ${segmentBreakdown.crossSegmentOverlap?.length ?? 0} cross-segment overlaps`);

  // 4. Build yearly trends
  console.log('\nBuilding yearly trends...');
  const yearlyTrends = buildYearlyTrends(organized);
  console.log(`  ${yearlyTrends.years.length} years of data: ${yearlyTrends.years.join(', ')}`);
  for (const [product, data] of Object.entries(yearlyTrends.byProduct)) {
    const yearSummary = data.map((d) => `${d.year}(${d.totalReviews})`).join(', ');
    console.log(`  ${product}: ${yearSummary}`);
  }

  // 5. Build the FullAnalysis object
  const breakdown = {
    EasyStretch: organized.EasyStretch.length,
    Compression: organized.Compression.length,
    'Ankle Compression': organized['Ankle Compression'].length,
    Other: organized.Other.length,
  };

  const fullAnalysis = {
    totalReviews: totalLoaded,
    breakdown,
    products,
    segmentBreakdown,
    yearlyTrends,
    _meta: {
      generatedAt: new Date().toISOString(),
      reviewFiles: CSV_FILES.map((f) => f.file),
      dataDir: DATA_DIR,
    },
  };

  // 6. Write JSON
  console.log(`\nWriting ${OUTPUT_PATH}...`);
  const json = JSON.stringify(fullAnalysis);
  fs.writeFileSync(OUTPUT_PATH, json, 'utf-8');
  const sizeKB = Math.round(fs.statSync(OUTPUT_PATH).size / 1024);
  console.log(`  Done! ${sizeKB} KB written.`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Reviews: ${totalLoaded.toLocaleString()}`);
  console.log(`Products: ${Object.keys(products).join(', ')}`);
  console.log(`Segments: ${segmentBreakdown.segments.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Size: ${sizeKB} KB`);
}

main();
