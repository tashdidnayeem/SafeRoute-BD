// Smart AI Classifier for SafeRoute BD
// Uses keyword scoring + context analysis — no external API needed

const ROAD_SAFETY_KEYWORDS = [
  "accident","crash","collision","hit","overturn","capsize","injured","injury",
  "dead","death","victim","casualty","bleeding","hospital","ambulance",
  "pothole","crater","broken road","damaged road","road damage","crack","uneven",
  "rough road","road blocked","no road","open manhole","manhole",
  "traffic","jam","congestion","signal broken","signal not working","no signal",
  "wrong way","illegal parking","blocked lane","blocked road",
  "flood","flooded","waterlogged","water logging","slippery","muddy",
  "debris","fallen tree","landslide","construction","digging","excavation",
  "dark","no light","street light","broken light",
  "rickshaw","cng","bus","truck","tempo","auto","bike","motorcycle",
  "highway","bridge","flyover","overpass","road","street","lane",
  "avenue","intersection","crossing","footpath","sidewalk","divider",
  // Banglish
  "rasta","gaat","pothole","dhaka","mirpur","farmgate","gulshan",
  "accident hoyeche","rasta block","traffic jam","andhar","brishti",
];

const HIGH_SEVERITY_KEYWORDS = [
  "accident","crash","collision","dead","death","dying","injured","injury",
  "casualty","victim","bleeding","serious","severe","critical","dangerous",
  "emergency","urgent","fire","explosion","overturn","major","fatal",
  "life threatening","ambulance","hospital","multiple","many people",
];

const MEDIUM_SEVERITY_KEYWORDS = [
  "pothole","traffic jam","congestion","flood","flooded","blocked",
  "broken signal","signal not working","slippery","muddy","debris",
  "fallen","open manhole","construction","digging","no light","dark road",
  "waterlogged","road damage","broken road",
];

const SPAM_INDICATORS = [
  "test","testing","asdf","qwerty","lorem","ipsum","hello world",
  "nothing","random","fake","dummy","sample","abc123","aaa","bbb",
];

const UNCLEAR_PATTERNS = [
  /^.{0,12}$/,      // under 12 chars
  /^[^a-zA-Z]*$/,   // no letters at all
  /(.)\1{4,}/,      // repeated chars like "aaaaaa"
];

const countMatches = (text, keywords) => {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
};

const isSpam = (text) => {
  const lower = text.toLowerCase().trim();
  const spamMatches = countMatches(lower, SPAM_INDICATORS);
  return spamMatches >= 1 && lower.length < 40;
};

const isUnclear = (text) => {
  return UNCLEAR_PATTERNS.some((p) => p.test(text.trim()));
};

export const classifyReport = async (issueType, description, hasMedia = false) => {
  const combined = `${issueType} ${description}`.toLowerCase().trim();
  const desc = description.toLowerCase().trim();

  const MEDIA_BOOST = hasMedia ? 0.15 : 0;
  const mediaNote = hasMedia ? " Media evidence attached (+confidence boost applied)." : "";

  // Step 1: Spam check
  if (isSpam(desc)) {
    console.log("AI: Spam detected");
    return {
      status: "Rejected",
      suggestedSeverity: null,
      aiNote: "AI auto-rejected: Report appears to be spam or test data. Please submit a real road safety issue.",
      confidence: 0.95,
    };
  }

  // Step 2: Unclear check (skip if has media — photo speaks for itself)
  if (isUnclear(desc) && !hasMedia) {
    console.log("AI: Description too unclear");
    return {
      status: "Pending",
      suggestedSeverity: null,
      aiNote: "AI flagged: Description is too short or unclear. Pending manual review.",
      confidence: 0.85,
    };
  }

  // Step 3: Legitimacy scoring
  const safetyMatches = countMatches(combined, ROAD_SAFETY_KEYWORDS);
  let score = 0;
  score += Math.min(safetyMatches * 0.12, 0.55); // keyword matches
  score += desc.length > 20 ? 0.10 : 0;          // some detail
  score += desc.length > 50 ? 0.10 : 0;          // good detail
  score += desc.length > 100 ? 0.05 : 0;         // great detail

  // Valid issue type is a strong signal
  const validTypes = ["accident","road damage","traffic jam","construction","flooding"];
  if (validTypes.some((t) => issueType.toLowerCase().includes(t.toLowerCase()))) {
    score += 0.20;
  }

  score = Math.min(score + MEDIA_BOOST, 0.99);

  console.log(`AI: matches=${safetyMatches}, descLen=${desc.length}, score=${(score*100).toFixed(1)}%`);

  // Step 4: Severity
  const highMatches = countMatches(combined, HIGH_SEVERITY_KEYWORDS);
  const mediumMatches = countMatches(combined, MEDIUM_SEVERITY_KEYWORDS);
  let suggestedSeverity = "Low";
  if (highMatches >= 2) suggestedSeverity = "High";
  else if (highMatches === 1 || mediumMatches >= 2) suggestedSeverity = "Medium";

  console.log(`AI: high=${highMatches}, medium=${mediumMatches} → ${suggestedSeverity}`);

  // Step 5: Final decision
  const VERIFY_THRESHOLD = hasMedia ? 0.30 : 0.42;

  if (score >= VERIFY_THRESHOLD) {
    console.log(`AI: ✅ Auto-Verified`);
    return {
      status: "Verified",
      suggestedSeverity,
      aiNote: `AI auto-verified: Legitimate ${suggestedSeverity.toLowerCase()} severity road safety report (confidence: ${(score * 100).toFixed(1)}%).${mediaNote}`,
      confidence: score,
    };
  }

  console.log(`AI: ⏳ Pending (score too low)`);
  return {
    status: "Pending",
    suggestedSeverity,
    aiNote: `AI review: Low confidence score (${(score * 100).toFixed(1)}%). Pending manual review.${mediaNote}`,
    confidence: score,
  };
};