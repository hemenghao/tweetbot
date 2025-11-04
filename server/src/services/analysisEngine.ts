import { CRYPTO_ASSETS, assetAliasMap } from '../utils/cryptoAssets.js';

const positiveWords = [
  'bullish',
  'buy',
  'long',
  'moon',
  'pump',
  'strong',
  'breakout',
  'undervalued',
  'accumulating',
];

const negativeWords = [
  'bearish',
  'sell',
  'short',
  'dump',
  'weak',
  'crash',
  'overvalued',
  'fomo',
];

const topicKeywords: Record<string, string[]> = {
  crypto: ['crypto', 'blockchain', 'digital asset', 'layer1', 'layer2'],
  DeFi: ['yield', 'defi', 'staking', 'liquidity', 'dex'],
  NFT: ['nft', 'collectible', 'mint', 'airdrop'],
  trading: ['trade', 'trading', 'leverage', 'position', 'entry', 'exit'],
};

const keywordRegex = /\b([A-Z]{2,6})\b/g;

const containsNumbers = (text: string) => /\d|%|\$\d/.test(text);
const containsReasoningIndicators = (text: string) => /because|due to|as a result|therefore|hence/i.test(text);
const containsOriginalIndicators = (text: string) => /i think|my view|we believe|our analysis|team/i.test(text);

const extractKeywords = (text: string): string[] => {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9#\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3);
  const unique = Array.from(new Set(tokens));
  return unique.slice(0, 15);
};

const detectTopics = (text: string): string[] => {
  const lower = text.toLowerCase();
  const topics = Object.entries(topicKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => lower.includes(keyword)))
    .map(([topic]) => topic);
  return topics.length ? topics : ['crypto'];
};

const detectAssets = (text: string) => {
  const matches = new Set<string>();
  const lower = text.toLowerCase();

  CRYPTO_ASSETS.forEach((asset) => {
    const aliasHit = asset.aliases.some((alias) => lower.includes(alias.toLowerCase()));
    if (aliasHit) {
      matches.add(asset.symbol);
    }
  });

  const symbolMatches = text.match(keywordRegex) || [];
  symbolMatches.forEach((symbol) => {
    const asset = assetAliasMap[symbol.toLowerCase()];
    if (asset) {
      matches.add(asset.symbol);
    }
  });

  return Array.from(matches).map((symbol) => {
    const asset = CRYPTO_ASSETS.find((item) => item.symbol === symbol)!;
    return {
      symbol: asset.symbol,
      name: asset.name,
    };
  });
};

const computeSentimentScore = (text: string): number => {
  const lower = text.toLowerCase();
  const positives = positiveWords.filter((word) => lower.includes(word)).length;
  const negatives = negativeWords.filter((word) => lower.includes(word)).length;
  const score = positives - negatives;
  const normalized = Math.max(-3, Math.min(3, score));
  return Number((normalized / 3).toFixed(2));
};

const sentimentFromScore = (score: number): 'bullish' | 'bearish' | 'neutral' => {
  if (score > 0.2) return 'bullish';
  if (score < -0.2) return 'bearish';
  return 'neutral';
};

export interface AnalysisEngineResult {
  mentioned_assets: Array<{
    symbol: string;
    name: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  }>;
  topics: string[];
  sentiment_score: number;
  quality_indicators: {
    has_data: boolean;
    has_reasoning: boolean;
    is_original: boolean;
    credibility: number;
  };
  keywords: string[];
  is_actionable: boolean;
}

export const analyzeTweetContent = (text: string): AnalysisEngineResult => {
  const assets = detectAssets(text);
  const sentiment_score = computeSentimentScore(text);
  const sentiment = sentimentFromScore(sentiment_score);
  const keywords = extractKeywords(text);
  const topics = detectTopics(text);

  const quality_indicators = {
    has_data: containsNumbers(text),
    has_reasoning: containsReasoningIndicators(text),
    is_original: containsOriginalIndicators(text),
    credibility: Math.min(1, 0.5 + (containsNumbers(text) ? 0.25 : 0) + (containsReasoningIndicators(text) ? 0.25 : 0)),
  };

  const mentioned_assets = assets.map(({ symbol, name }) => ({
    symbol,
    name,
    sentiment,
    confidence: assets.length ? Number((1 / assets.length).toFixed(2)) : 0,
  }));

  const is_actionable = Boolean(
    assets.length &&
      (sentiment === 'bullish' || sentiment === 'bearish') &&
      quality_indicators.has_data &&
      quality_indicators.has_reasoning
  );

  return {
    mentioned_assets,
    topics,
    sentiment_score,
    quality_indicators,
    keywords,
    is_actionable,
  };
};
