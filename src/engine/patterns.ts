/**
 * Pattern Definitions for Viasox Review Analysis
 *
 * TWO-LAYER SEGMENTATION MODEL:
 *
 * Layer 1 — IDENTITY SEGMENTS (narrow, who they are):
 *   Healthcare Worker, Caregiver/Gift Buyer, Diabetic/Neuropathy,
 *   Standing Worker, Accessibility/Mobility, Traveler, Senior, Pregnant/Postpartum
 *
 * Layer 2 — MOTIVATION SEGMENTS (broad, why they buy):
 *   Comfort Seeker, Pain & Symptom Relief, Style Conscious, Quality & Value,
 *   Daily Wear Convert, Skeptic Converted, Emotional Transformer, Repeat Loyalist
 *
 * Every review should match at least one motivation segment.
 * Identity segments are narrower and provide demographic enrichment.
 * A review can (and often will) match multiple segments across both layers.
 */

// ─── Pain Patterns ──────────────────────────────────────────────────────────

export const PAIN_PATTERNS: Record<string, RegExp> = {
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

// ─── Benefit Patterns ───────────────────────────────────────────────────────

export const BENEFIT_PATTERNS: Record<string, RegExp> = {
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

// ─── Transformation Patterns ────────────────────────────────────────────────

export const TRANSFORMATION_PATTERNS: Record<string, RegExp> = {
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

// ─── LAYER 1: Identity Segments (narrow — WHO they are) ─────────────────────

export const IDENTITY_SEGMENT_PATTERNS: Record<string, RegExp> = {
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

// ─── LAYER 2: Motivation Segments (broad — WHY they buy) ────────────────────

export const MOTIVATION_SEGMENT_PATTERNS: Record<string, RegExp> = {
  comfort_seeker: /\b(comfort|comfortable|soft|cozy|cushion|plush|comfy|gentle|breathab|like a cloud|second skin|heavenly|baby soft|silky|pamper|like butter|feels? (great|amazing|wonderful|incredible|fantastic)|forget I'm wearing|don't (even )?feel|like wearing nothing|most comfortable|so soft|not itchy|no itch|snug but not tight|don't pinch|no pressure)\b/i,

  pain_symptom_relief: /\b(swell|swollen|pain|ache|achy|hurt|sore|cramp|throb|numb|tingling|burning|heavy legs|tired (feet|legs)|circulation|blood flow|stiff|inflammation|flare|acts? up|bother|pins and needles|heel pain|arch pain|plantar|planter|calf pain|restless leg|shooting pain|feet (were|are) killing|reduce.{0,10}(swelling|pain|pressure))\b/i,

  style_conscious: /\b(cute|pretty|beautiful|stylish|fashion|love the (color|pattern|design)|fun (design|pattern)|trendy|look(s)? (good|great|nice)|compliment|got compliment|people ask|not ugly|don't look (like )?medical|doesn't look (like )?compress|eye.?catching|vibrant|bold (color|pattern)|sleek|modern|attractive|professional look|doesn't scream|no one can tell|love the design|variety of (color|pattern|style)|not embarrass|actually look nice|wore them to (work|the office))\b/i,

  quality_value: /\b(worth (every|the) (penny|price|money)|well made|well-made|held up|holding up|after (several|many|dozens of) wash|still like new|durable|durability|don't wear out|no holes|high quality|good quality|better than|tried other|compared to|you get what you pay|investment|last (a long time|forever)|didn't pill|no pilling|didn't shrink|color didn't fade|elastic held|didn't lose.{0,10}shape|well constructed|premium|bang for|money well spent|not flimsy|built to last)\b/i,

  daily_wear_convert: /\b(every ?day|daily|all I wear|only socks? I (wear|buy|use)|replaced all|threw out|go-?to|wardrobe staple|wear.{0,10}everything|all[- ]?day comfort|morning to night|Monday through Friday|work week|reliable|never disappoints|can count on|grab a pair|in my rotation|enough pairs|no fuss|hassle ?free|just works|perfect for daily|around the house|for work|to the office|all day|whole drawer)\b/i,

  skeptic_converted: /\b(skeptic|sceptic|didn't (think|believe|expect)|wasn't sure|hesitant|took a chance|figured I'?d try|pleasantly surprised|pleasant surprise|proved me wrong|I was wrong|actually work|to my surprise|have to admit|I'll admit|exceeded (my )?expectation|better than expected|blew me away|I stand corrected|I'm a (convert|believer)|thought it was (hype|gimmick)|gave it a shot|last resort|tried everything|nothing else worked|glad I tried|should have tried sooner)\b/i,

  emotional_transformer: /\b(life.?chang|changed my life|game.?changer|miracle|godsend|god.?send|blessing|saved (my|me)|gave me.{0,10}(life|back)|can (walk|sleep|move) again|no more pain|pain.?free|night and day|used to (dread|hate|struggle)|dreaded|now I can|now I'm able|for the first time in|I cried|made me cry|tears?|so grateful|grateful|thank (you|god)|amazing difference|transformed|never going back|can't live without|essential|necessity|best thing|such relief|instant relief|freedom|gave me my|finally (found|a sock|something))\b/i,

  repeat_loyalist: /\b(order(ed|ing)? (again|more)|back for more|second pair|third pair|fourth pair|fifth pair|buying more|stocking up|this time I (got|ordered)|already (have|own)|been buying.{0,10}(for years|for months)|loyal customer|keep coming back|won't buy anything else|switched to these|never going back to|my (second|third|fourth|fifth|\d+(st|nd|rd|th)) order|still (love|great)|just as good as|consistent quality|haven't changed|every few months|replacing my|wore.{0,10}(last|old) (ones?|pair)|time to restock|whole drawer|recommended to|told (my |every)|entire family|customer for life|brand loyal)\b/i,
};

// ─── Combined segment map for backward compat ────────────────────────────

/** All segment patterns merged — identity + motivation */
export const SEGMENT_PATTERNS: Record<string, RegExp> = {
  ...IDENTITY_SEGMENT_PATTERNS,
  ...MOTIVATION_SEGMENT_PATTERNS,
};

// ─── Story detection ────────────────────────────────────────────────────────

export const TRANSFORMATION_STORY_PATTERN =
  /\b(before|used to|finally|no more|now I|changed my|game.?changer|life.?chang|gave me|for the first time)\b/i;
