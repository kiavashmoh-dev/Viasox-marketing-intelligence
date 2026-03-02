import type { RawComment } from '../utils/commentCsv';
import { buildSystemBase } from './systemBase';

export interface CategorizedCommentData {
  i: number;
  cat: 'Engagement' | 'Question' | 'Testimonial' | 'Objection' | 'Request' | 'Complaint' | 'Spam';
  sent: 'Positive' | 'Neutral' | 'Negative';
  theme: string;
}

export function buildCommentCategorizationPrompt(
  comments: RawComment[],
): { system: string; user: string } {
  const system = `You are an ad comment analyst for Viasox, a DTC compression sock brand. Your job is to categorize social media ad comments and identify sentiment.

## CATEGORIES
Assign EXACTLY ONE category per comment:

- **Engagement** — Generic positive reactions, emoji-only, simple praise ("Love this!", "Great ad!", "🔥🔥")
- **Question** — Product inquiry, sizing, shipping, availability, "how does it work?" ("Do these come in wide?", "How long does shipping take?")
- **Testimonial** — Personal positive experience with the product ("I bought these and they changed my life", "Best socks I've ever owned")
- **Objection** — Pricing concern, skepticism, comparison to competitors, doubt ("Too expensive", "These look like regular socks", "I tried compression socks and they didn't work")
- **Request** — Feature request, product suggestion, color/size request ("Please make these in black", "Do you have ankle-length?")
- **Complaint** — Negative product experience, quality issue, delivery problem ("These fell apart after 2 washes", "Wrong size shipped")
- **Spam** — Irrelevant, bot-like, scam links, completely off-topic

## SENTIMENT
Assign EXACTLY ONE sentiment:
- **Positive** — Favorable toward brand/product
- **Neutral** — Informational, neither positive nor negative
- **Negative** — Unfavorable, critical, disappointed

## KEY THEME
A short 2-5 word phrase capturing the core topic (e.g., "pricing concern", "product quality praise", "sizing question", "gift for parent", "compression effectiveness").

## OUTPUT FORMAT
Return ONLY valid JSON. No markdown, no explanation, no wrapping.

Return a JSON object with this exact structure:
{
  "results": [
    { "i": 0, "cat": "Testimonial", "sent": "Positive", "theme": "compression effectiveness" },
    { "i": 1, "cat": "Question", "sent": "Neutral", "theme": "sizing question" }
  ]
}

Where "i" is the 0-based comment index, "cat" is the category, "sent" is sentiment, "theme" is the key theme.
Process ALL comments. Do not skip any.`;

  const commentList = comments
    .map((c, i) => {
      const meta = [c.platform, c.brand, c.adName].filter(Boolean).join(' | ');
      return `[${i}] ${meta ? `(${meta}) ` : ''}${c.comment}`;
    })
    .join('\n');

  const user = `Categorize these ${comments.length} ad comments. Return ONLY the JSON object.\n\n${commentList}`;

  return { system, user };
}

export function buildCommentInsightsPrompt(
  summary: {
    totalComments: number;
    byCat: Record<string, number>;
    bySentiment: Record<string, number>;
    topThemes: { theme: string; count: number; category: string }[];
  },
  samplesByCategory: Record<string, string[]>,
): { system: string; user: string } {
  const system = `${buildSystemBase()}

## COMMENT INTELLIGENCE REPORT

You are generating an Ad Comment Intelligence Report based on categorized social media ad comments. This report helps the creative team understand what's working, what objections to address, and what angles to pursue.

Write in a strategic, actionable tone. Every insight should tie to a creative recommendation.`;

  const lines: string[] = [];
  lines.push(`## AD COMMENT DATA SUMMARY`);
  lines.push(`Total Comments Analyzed: ${summary.totalComments}`);
  lines.push('');

  lines.push('### Category Breakdown');
  for (const [cat, count] of Object.entries(summary.byCat).sort((a, b) => b[1] - a[1])) {
    const pct = Math.round((count / summary.totalComments) * 100);
    lines.push(`- ${cat}: ${count} (${pct}%)`);
  }
  lines.push('');

  lines.push('### Sentiment Breakdown');
  for (const [sent, count] of Object.entries(summary.bySentiment).sort((a, b) => b[1] - a[1])) {
    const pct = Math.round((count / summary.totalComments) * 100);
    lines.push(`- ${sent}: ${count} (${pct}%)`);
  }
  lines.push('');

  if (summary.topThemes.length > 0) {
    lines.push('### Top Themes');
    for (const t of summary.topThemes.slice(0, 15)) {
      lines.push(`- "${t.theme}" (${t.count}x, ${t.category})`);
    }
    lines.push('');
  }

  lines.push('### Sample Comments by Category');
  for (const [cat, samples] of Object.entries(samplesByCategory)) {
    if (samples.length === 0) continue;
    lines.push(`\n**${cat}:**`);
    for (const s of samples.slice(0, 5)) {
      lines.push(`- "${s}"`);
    }
  }

  const user = `${lines.join('\n')}

---

Generate the Ad Comment Intelligence Report with these sections:

### 1. EXECUTIVE SUMMARY
Key findings in 3-4 bullet points. What's the overall sentiment? What stands out?

### 2. TOP OBJECTIONS TO ADDRESS
List each major objection theme with:
- The objection (with sample quote)
- Frequency / severity
- Recommended response strategy for ads
- Suggested ad angle to counter this objection

### 3. BEST TESTIMONIALS FOR ADS
Highlight the strongest testimonials that could be repurposed in:
- UGC-style ads
- Static ad copy
- Landing page social proof
Include the actual quotes and explain why each is powerful.

### 4. RECURRING QUESTIONS (CONTENT OPPORTUNITIES)
What questions keep coming up? Each represents content to create:
- FAQ page updates
- Ad creative that preemptively answers
- Email/landing page content

### 5. COMPLAINT PATTERNS
What are people unhappy about? What can be addressed in product, shipping, or messaging?

### 6. AD ANGLE IDEAS
Based on ALL the comment data, suggest 5-8 fresh ad angles. For each:
- Angle name
- Why the data supports it (reference specific themes/quotes)
- Suggested hook line
- Best format (UGC, static, video)

### 7. STRATEGIC RECOMMENDATIONS
3-5 high-level recommendations for the creative team based on this data.`;

  return { system, user };
}
