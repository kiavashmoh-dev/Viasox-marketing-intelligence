import type { AdType } from '../engine/types';

/**
 * Detailed ad type guides used by both anglesPrompt and scriptPrompt.
 * These contain production-level detail about what each format IS,
 * how it's made, what makes it unique, and what the output should look like.
 */

const AD_TYPE_GUIDES_FULL: Record<AdType, string> = {
  'AGC (Actor Generated Content)': `**AGC (Actor Generated Content) — VIDEO**

**What it is:** Video ads filmed by a production team using hired actors/talent. A detailed brief with exact shot directions, dialogue, props, and visual cues is written — and a production manager executes it on set.

**What makes it unique:** Total creative control. Unlike UGC where a creator interprets a brief on their own, AGC puts your cameras, your crew, and your direction on set. You decide the shot type (selfie, POV, tabletop, ground-level, dynamic third-person), the exact props, the demonstrations, and the emotional beats.

**Biggest advantage:** Creative precision. You can do things UGC creators simply can't — specific tabletop demos with props, controlled studio lighting, exact product demonstrations (like stretching a sock to 30 inches with a measuring tape), multiple camera angles in one shoot, and B-roll that perfectly matches the script. Consistency across multiple briefs filmed in one session.

**How it's typically made:** A brief with a strategy header (concept, angle, avatar, location, product, collection, promotion, offer) followed by a shot-by-shot breakdown. Each row specifies whether it's BROLL or SCRIPT, the shot type, visual direction, spoken lines, and caption needs. Multiple hook variations (typically 9) are written so editors can mix and match. Production films on set — house, studio, packing station, café, or outdoor location.

**What the output looks like:** Feels like a polished UGC-style testimonial or educational video, but with noticeably better visual storytelling — tighter cuts, more creative B-roll, specific demonstrations, and controlled environments. The viewer shouldn't realize it's "acted" — it should feel authentic but look elevated.

**Script requirements:** Full word-for-word dialogue. Precise stage directions for every beat. Shot type specified for each scene (selfie cam, tabletop, wide, CU). Wardrobe notes. Setting/location description. Props list. Emotional beats marked. Multiple hook variations. B-roll direction that matches the narrative.

**Concept considerations:** When generating concepts for AGC, think about WHAT YOU CAN CONTROL that makes this more powerful than UGC — specific demonstrations, controlled environments, precise product handling, multi-angle coverage, and visual storytelling that requires a crew.`,

  'UGC (User Generated Content)': `**UGC (User Generated Content) — VIDEO**

**What it is:** Video ads created by independent content creators who receive a brief, then film and deliver the content themselves from their own homes or locations.

**What makes it unique:** The creator is both the talent AND the production. They use their phone, their space, their personality. This gives the content a raw, authentic, "real person" feel that audiences on Meta trust more than traditional advertising.

**Biggest advantage:** Authenticity and relatability. UGC feels like a recommendation from a friend or someone who genuinely uses the product, not a brand selling to you. It scales well — multiple creators filming simultaneously without booking sets or crews.

**How it's typically made:** A brief with a concept, hook options, body script, and general visual direction — but you can't micromanage every shot because the creator controls their environment. The brief gives them the story arc, key talking points, product features to highlight, and the emotional tone. They film on their phone, usually at home, and send back raw footage.

**What the output looks like:** A person talking directly to camera (usually selfie-style), sharing their experience with the product. It looks native to social media — like something a real customer would post. Someone sitting on their couch saying "okay I have to talk about these socks" with genuine energy. Less polished than AGC — that's the point.

**Script requirements:** Conversational talking points rather than rigid word-for-word scripts. Key phrases to hit but room for natural delivery. First person voice ("I have to tell you..."). Hook must feel personal and urgent. Keep it loose — the creator adds their personality.

**Concept considerations:** When generating concepts for UGC, think about what a REAL PERSON would naturally say about this product. The concept should describe a relatable scenario a creator could film at home. The energy should feel like a genuine recommendation, not a performance.`,

  'Founder Style': `**Founder Style / EGC (Employee Generated Content) — VIDEO**

**What it is:** Video ads featuring the brand's actual founder or employees, filmed in authentic brand environments like the warehouse, office, or fulfillment center. For Viasox, this means Dimos (the founder) speaking directly to camera from the actual warehouse surrounded by inventory.

**What makes it unique:** No actor can replicate the credibility of the actual person who built the brand standing in their own warehouse surrounded by thousands of product bins. It creates authentic trust that can't be manufactured (Neumeier). The lav mic being visible, real barcodes on boxes, actual inventory — all signal "this is not a commercial."

**Biggest advantage:** Unmatched credibility and trust. When the founder says "we made too many socks," and you can SEE hundreds of blue bins behind him, the claim is visually proven in real time. This is Hopkins' specificity principle brought to life — the proof IS the environment. It flips the sales dynamic from "buy our product" to "please help us move this inventory," removing the defensive barrier.

**How it's typically made:** The founder films in an authentic brand location (warehouse, fulfillment center). Camera work is simple — often starts with a dramatic establishing shot (high-angle showing scale of inventory), then settles into medium shot of founder talking. Props are whatever's naturally in the environment. The script follows hook → mechanism/education → offer → CTA. Intentionally less "produced" than AGC.

**What the output looks like:** Feels like the founder pulled out a camera and said "I need to tell you something." Casual wardrobe, natural setting, real inventory visible. It looks different from every other ad in the feed because it doesn't look like an ad at all — it looks like behind-the-scenes access. The visual freshness IS the pattern interrupt.

**Script requirements:** Talking points with personal story arc. Hook should be an attention-grabbing problem statement or revelation. Emotional beats marked. Data points to cite. Language must sound authentic and personal — not corporate. Setting description (warehouse with blue bins, packing stations, inventory shelves).

**Concept considerations:** When generating concepts for Founder Style, leverage the REAL ENVIRONMENT as proof. Think about what claims become instantly credible when said while standing in a warehouse full of product. The concept should describe what the founder reveals, demonstrates, or shares — not what an actor performs.`,

  'Ecom Style': `**Ecom Style (Editing Briefs) — VIDEO**

**What it is:** Video ads built entirely from existing footage — past B-roll, product shots, lifestyle clips — stitched together by an editor with AI voiceover narrating the script. No new filming required.

**What makes it unique:** Constructed entirely in post-production, not on set. The creative strategist writes the script and visual direction, then the editor matches existing footage to each line. This means high volumes of creative without booking shoots, actors, or locations.

**Biggest advantage:** Speed and volume. Drawing from a large bank of existing clips, many concepts can be produced quickly. This is the workhorse format for testing angles, hooks, and messaging at scale. Highly flexible — seasonal versions, different awareness levels, fast iteration based on performance data.

**How it's typically made:** A brief with concept details (angle, avatar, awareness level, persona), editing instructions (pacing, resolution, transitions, music, captions), 3 hook variations (each with shot type, visual description, and script line), and a full body script with visual direction for every line. The editor pulls from existing footage, adding text overlays, graphics, and AI voiceover.

**What the output looks like:** A polished video ad with voiceover narration playing over relevant B-roll footage. Text overlays emphasize key points. Pacing is tight and intentional. Looks like a well-produced brand video — product showcases, lifestyle montages, or educational explainers. The viewer experiences a cohesive story without realizing it was assembled from pre-existing clips.

**Script requirements:** Voiceover narration script (not dialogue). Strong visual direction for every line — describe exactly what footage should appear. Text overlay callouts for key benefits/claims. Music/pacing notes. The editor needs to know what to pull from the footage library.

**Concept considerations:** When generating concepts for Ecom Style, think about what story can be told purely through EXISTING footage with a compelling voiceover. The concept should describe the narrative arc, the visual sequences, and the text overlays — all things an editor can build without a shoot.`,

  'Static': `**Static Ads — SINGLE IMAGE (NOT VIDEO)**

**What it is:** Single-image ads (not video) designed for the Meta feed. Graphic designs featuring product photography, lifestyle imagery, headlines, body copy, and offer information — all composed into one compelling visual.

**What makes it unique:** ONE frame to stop the scroll, communicate the problem, present the solution, and drive action. No "body" to build a story over time — the entire persuasion happens in a single glance. Every word and every visual choice is exponentially more important.

**Biggest advantage:** Simplicity and clarity. For an older audience like Viasox's, a clean static with a problem-specific headline and clear product shot can outperform complex video. Statics load instantly, work without sound, and are cheap/fast to produce at scale with pattern variations. One concept can generate 12+ variations by swapping patterns, headlines, and layouts.

**How it's typically made:** A brief with the strategic concept (angle, persona, awareness level, emotion), visual concept description, hero element (product shot, lifestyle, before/after, demo, review quote, or comparison), headline and body copy with 3-5 variations, and pattern variation specs. The designer brings creative interpretation — you guide strategy and messaging.

**What the output looks like:** A single image in 9:16 or 1:1 format with bold, immediately readable text (headline), clear product image or lifestyle shot, the offer (Buy 2 Get 3 Free), and often social proof (star rating, review count). Simple and uncluttered — one message, one visual, one action. Should NOT look clinical or medical. Clean DTC brand aesthetic with warm, approachable energy.

**Script requirements:** This is NOT a video script. Output: Headline (max 12 words), Subhead, Body copy (max 2 lines), CTA button text, Visual description/art direction, and 3-5 headline variations.

**Concept considerations:** When generating concepts for Static, think about what single IMAGE and single HEADLINE would stop someone scrolling. The concept should describe the visual composition, the hero element, and the headline strategy — not scenes or dialogue.`,

  'Packaging/Employee': `**Packaging / Employee (Packing Room Style) — VIDEO**

**What it is:** Video ads filmed from the POV of an employee packing orders at a fulfillment station, narrating over the action. The camera shows hands selecting products from shelves, placing them in branded shipping boxes, and preparing them for shipment — while voiceover explains why the product is special.

**What makes it unique:** Creates an "insider access" feel. The viewer is watching their order being packed, creating intimacy and demand proof. Seeing shelves stocked with product, boxes being assembled, and orders being shipped implies volume — "this brand is real, busy, and popular."

**Biggest advantage:** Social proof through implication. You never say "we're popular" — the visual of someone packing dozens of orders proves it. It humanizes the brand (a real person handles your order) and the packing action creates a natural rhythm that keeps viewers watching. Per Hopkins, this is the "reason why" made visual — the environment IS the evidence.

**How it's typically made:** Filmed at a packing station (AGC format) with branded shipping materials, shelving units stocked with product, tissue paper, and shipping boxes. Camera is typically POV (hands and table visible, no face) with voiceover carrying the script. Talent talks about the product while physically handling it — pulling socks from shelves, showing patterns, demonstrating features, then packing them. Props include nitrile gloves, branded boxes, multiple product patterns, and sometimes a fishbowl with "customer name" cards.

**What the output looks like:** Feels like a behind-the-scenes fulfillment video on TikTok or Instagram. Packing action is continuous and satisfying to watch (almost ASMR-like), while voiceover does the selling. Looks nothing like a traditional ad — bypasses the viewer's "ad filter" entirely.

**Script requirements:** Voiceover narration (not direct-to-camera dialogue). Detailed visual direction for what hands are doing in each beat — pulling product, showing features, folding, packing. Props to include. The physical actions should REINFORCE the claims in the voiceover (e.g., stretching the sock while talking about comfort).

**Concept considerations:** When generating concepts for Packaging/Employee, think about what ACTIONS during packing can demonstrate the product's benefits. The concept should describe what the hands do, what the voiceover says, and how the two work together to prove the claims.`,

  'Street Interview Style': `**Street Interview Style — VIDEO**

**What it is:** Video ads formatted to look like spontaneous person-on-the-street interviews, where someone (usually with a mic) approaches "random" people and asks questions related to the product's problem or benefit space. Typically staged with actors but designed to feel candid and unscripted.

**What makes it unique:** Borrows credibility from a style viewers already trust and enjoy — the viral street interview format from YouTube and TikTok. Feels editorial and entertaining rather than commercial. The "interviewer + stranger" dynamic creates built-in tension and curiosity.

**Biggest advantage:** Pattern interrupt and entertainment value. People are conditioned to watch street interviews because they're inherently unpredictable and fun. This hijacks that behavior — the viewer starts watching because they're curious about the interaction, and before they realize it, they're learning about the product. Naturally introduces social proof when multiple people react positively.

**How it's typically made:** Filmed outdoors in a public-feeling location (AGC format). An interviewer with a mic approaches "strangers" (actors) and asks questions like "Do your feet swell by the end of the day?" or "Have you ever heard of ankle compression?" Responses are scripted but delivered to feel natural. B-roll of product cut in. Multiple "interviews" spliced together for a montage effect.

**What the output looks like:** Looks like a viral street interview clip — handheld camera, outdoor setting, mic in frame, quick cuts between different "interviewees" reacting with surprise, curiosity, or excitement. Captions are prominent. Energy is light and entertaining. Product education happens through dialogue, not voiceover. Blends into the Meta feed as content, not advertising.

**Script requirements:** Interviewer questions scripted. Multiple interviewee responses scripted (but written to sound spontaneous). Key reaction moments marked. Product demonstration or reveal beat. Quick-cut structure between multiple "interviews." Captions/text overlay notes.

**Concept considerations:** When generating concepts for Street Interview, think about what QUESTIONS would create the most entertaining and educational interactions. The concept should describe the interview scenario, the location, the types of "strangers" being approached, and the key surprise/discovery moments.`,

  'Fake Podcast Ads': `**Fake Podcast Ads — VIDEO**

**What it is:** Video ads designed to look like a clip from a podcast conversation — two people sitting across from each other (usually with podcast mics visible) having what appears to be an organic discussion that naturally leads to the product.

**What makes it unique:** Exploits the trust and authority that podcast formats carry. When people see two people in a podcast setup discussing something, they subconsciously assign more credibility than they would to someone selling direct-to-camera. The format implies "this came up naturally in a real conversation" rather than "this is scripted to sell you something."

**Biggest advantage:** Borrowed authority and the perception of organic discovery. The viewer feels like they're eavesdropping on a genuine conversation where someone happened to mention this product. This is Schwartz's gradualization in action — building belief incrementally through natural exchange rather than a sales pitch. The two-person format allows a natural "skeptic + believer" dynamic — one person asks the questions the viewer is thinking, the other provides answers.

**How it's typically made:** Filmed in a studio or room set up to look like a podcast space (AGC format) — two chairs, table, podcast-style mics, background decor (bookshelves, plants). Two actors have a scripted conversation written to sound casual and spontaneous. One plays the "host" or curious friend, the other plays the "guest" with product experience. The script hits all selling points through dialogue, not monologue.

**What the output looks like:** Looks like a clipped segment from a podcast episode — the kind of short clip that goes viral on social media. Two people talking, podcast mics visible, warm lighting, conversation flows naturally. Captions run along the bottom. Product mention feels earned, not forced. Blends into feed as content people would choose to watch. Usually 30-60 seconds for Meta.

**Script requirements:** Two-person dialogue. One character = "host/skeptic" (asks questions viewer is thinking). Other character = "guest/believer" (provides answers with data/experience). Natural interruptions and reactions. The product discovery moment must feel organic. Specific claims backed by data woven into the conversation.

**Concept considerations:** When generating concepts for Fake Podcast, think about what CONVERSATION would naturally lead to this product. The concept should describe: who the two people are, what they're discussing, the "discovery moment" when the product comes up, and how skepticism gets converted to belief through the dialogue.`,

  'Spokesperson': `**Spokesperson Ads — VIDEO**

**What it is:** Video ads featuring an authority figure or expert presenting the product — a doctor, nurse, athlete, or professional endorser. They speak with credibility and personal experience that gives weight to the product claims.

**What makes it unique:** The spokesperson's CREDENTIALS do the heavy lifting. When a nurse says "I wear these through my 12-hour shifts," the claim carries the weight of professional experience. When a doctor discusses graduated compression, the medical authority validates the product mechanism. The expert IS the proof.

**Biggest advantage:** Authority-driven trust. Per Hopkins, the spokesperson must offer SERVICE — expertise, knowledge, advice. Per Schwartz, this is the "expert mechanism" — people trust the product because they trust the source. Per Bly, specificity from an expert mouth is 10x more powerful: "As a nurse who works 12-hour shifts, I can tell you..." beats generic endorsement.

**How it's typically made:** Filmed with the spokesperson in an environment that reinforces their authority (hospital hallway, gym, clinic, home office with credentials visible). Can be AGC with an actor playing the role, or actual professionals. Script is structured as expert testimony — personal experience → professional insight → product recommendation → specific claims they're qualified to make.

**What the output looks like:** An expert speaking with conviction directly to camera. Their credentials are visible (scrubs, lab coat, athletic wear, framed degrees in background). The tone is authoritative but warm — they're EDUCATING and RECOMMENDING, not selling. Data points and specific claims feel natural coming from their expertise.

**Script requirements:** Expert credentials established in the first 3 seconds. Specific claims they're QUALIFIED to make (not generic marketing claims). Personal experience with the product. Data points validated through their professional lens. Authoritative but warm tone — education, not sales. Setting/wardrobe that reinforces authority.

**Concept considerations:** When generating concepts for Spokesperson, think about WHICH type of expert would have the most credibility for this angle. The concept should describe: who the expert is, what their credentials are, what specific claim they're uniquely qualified to make, and what environment reinforces their authority.`,
};

/**
 * Full detailed guide for use in anglesPrompt (concept generation needs full context)
 */
export function buildAdTypeGuideFull(adType: AdType): string {
  return AD_TYPE_GUIDES_FULL[adType] ?? '';
}

/**
 * Compact guide for use in scriptPrompt (script writing needs the key points, not the full production manual)
 */
export function buildAdTypeGuideCompact(adType: AdType): string {
  const compactGuides: Record<AdType, string> = {
    'AGC (Actor Generated Content)': `**AGC (Actor Generated Content) — VIDEO.** Filmed by a production team with hired actors. Full creative control — you direct every shot, prop, demo, and emotional beat. Script must be word-for-word with precise stage directions, shot types (selfie, POV, tabletop, wide, CU), wardrobe notes, and setting descriptions. Multiple hook variations for editor mix-and-match. The output should feel like an authentic testimonial but with elevated visual storytelling — specific demonstrations, controlled environments, tighter cuts. The viewer shouldn't realize it's acted.`,

    'UGC (User Generated Content)': `**UGC (User Generated Content) — VIDEO.** Created by independent creators filming on their phones at home. Write conversational talking points, NOT rigid word-for-word scripts. First person voice ("I have to tell you..."). The brief gives story arc, key phrases to hit, and emotional tone — but leave room for the creator's personality. Output looks native to social media — someone on their couch sharing a genuine recommendation. Raw and authentic is the goal.`,

    'Ecom Style': `**Ecom Style (Editing Brief) — VIDEO.** Built entirely from existing footage with AI voiceover — no new filming. Write a voiceover narration script with detailed visual direction for every line so an editor can match existing B-roll. Include text overlay callouts for key benefits, pacing/music notes. Output is a polished brand video — product showcases, lifestyle montages, educational explainers — assembled from pre-existing clips.`,

    'Static': `**Static — SINGLE IMAGE (NOT VIDEO).** One frame to stop the scroll. This is NOT a video script. Output: Headline (max 12 words), Subhead, Body copy (max 2 lines), CTA button text, Visual description/art direction, and 3-5 headline variations. Clean DTC aesthetic, warm and approachable — not clinical or medical. One message, one visual, one action. Must work without sound or motion.`,

    'Founder Style': `**Founder Style / EGC — VIDEO.** The actual brand founder (Dimos) speaking to camera from the real warehouse, surrounded by inventory. The environment IS the proof — blue bins, packing stations, real product visible. Talking points with personal story arc, NOT rigid scripts. Language must sound authentic and personal. Establish the setting first (dramatic establishing shot showing scale), then settle into medium shot of founder talking. Hook → mechanism → offer → CTA.`,

    'Fake Podcast Ads': `**Fake Podcast Ads — VIDEO.** Two people in a podcast setup having a scripted conversation designed to feel organic. One = "host/skeptic" (asks questions the viewer thinks), other = "guest/believer" (provides answers). Write as TWO-PERSON DIALOGUE with natural interruptions and reactions. The product mention must feel earned, not forced. The skeptic-to-believer arc is the story structure. Podcast mics visible, warm lighting, conversational energy.`,

    'Street Interview Style': `**Street Interview Style — VIDEO.** Interviewer with mic approaches "strangers" (actors) outdoors. Write interviewer questions + multiple interviewee responses (scripted to sound spontaneous). Quick-cut structure between multiple interviews. Mark key reaction/surprise moments. Product education through dialogue, not voiceover. Handheld camera, outdoor setting, mic in frame. Entertainment-first, education-second.`,

    'Spokesperson': `**Spokesperson — VIDEO.** Authority figure (nurse, doctor, athlete, expert) speaking to camera. Credentials established in first 3 seconds (scrubs, lab coat, degrees visible). Write specific claims they're QUALIFIED to make from professional experience. Authoritative but warm — educating and recommending, not selling. Personal experience with the product validates the claims. Data points delivered through their expert lens.`,

    'Packaging/Employee': `**Packaging/Employee (Packing Room) — VIDEO.** POV of hands packing orders at a fulfillment station with voiceover narration. Camera shows hands selecting products from shelves, demonstrating features, packing into branded boxes. The physical actions REINFORCE the voiceover claims (stretch the sock while talking about comfort). Props: nitrile gloves, branded boxes, product patterns, shelving. ASMR-like packing rhythm keeps viewers watching. Social proof through visual implication — busy packing station = real demand.`,
  };
  return compactGuides[adType] ?? '';
}
