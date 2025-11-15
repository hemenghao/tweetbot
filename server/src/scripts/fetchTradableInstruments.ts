import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

interface StandardizedInstrument {
  unique_id: string;
  exchange: string;
  symbol?: string;
  base_asset?: string | null;
  quote_asset?: string | null;
  event_id?: string | null;
  category_tags: string[];
  raw?: Record<string, unknown>;
}

type InstrumentFetcher = () => Promise<StandardizedInstrument[]>;

const OUTPUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');

const KEYWORD_TAGS: Array<{ tag: string; keywords: string[] }> = [
  { tag: 'meme', keywords: ['meme', 'doge', 'shib', 'pepe', 'wojak'] },
  { tag: 'ai', keywords: ['ai', 'artificial intelligence', 'gpt', 'machine learning'] },
  { tag: 'defi', keywords: ['defi', 'dex', 'swap', 'yield', 'lending', 'amm'] },
  { tag: 'layer2', keywords: ['layer2', 'l2', 'arbitrum', 'optimism', 'base', 'zk', 'scroll', 'mantle'] },
];

const sanitize = (value: string | null | undefined): string | null => {
  if (value === undefined || value === null) return null;
  const trimmed = value.toString().trim();
  return trimmed.length ? trimmed : null;
};

const buildTags = (instrument: StandardizedInstrument, additionalText: string[] = []): string[] => {
  const text = [
    instrument.symbol,
    instrument.base_asset,
    instrument.quote_asset,
    ...(instrument.category_tags || []),
    ...additionalText,
  ]
    .filter(Boolean)
    .map((part) => part!.toLowerCase())
    .join(' ');

  const tags = new Set<string>(instrument.category_tags);
  for (const { tag, keywords } of KEYWORD_TAGS) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.add(tag);
    }
  }

  return Array.from(tags).sort();
};

const fetchBinance: InstrumentFetcher = async () => {
  try {
    const { data } = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    const symbols: Array<Record<string, any>> = Array.isArray(data?.symbols) ? data.symbols : [];

    return symbols
      .filter((symbol) => symbol.status === 'TRADING')
      .map((symbol) => {
        const base = sanitize(symbol.baseAsset);
        const quote = sanitize(symbol.quoteAsset);
        const standardized: StandardizedInstrument = {
          unique_id: `binance:${symbol.symbol}`,
          exchange: 'binance',
          symbol: sanitize(symbol.symbol) ?? undefined,
          base_asset: base,
          quote_asset: quote,
          category_tags: [],
          raw: symbol,
        };

        standardized.category_tags = buildTags(standardized);
        return standardized;
      });
  } catch (error) {
    console.error('[binance] Failed to fetch exchange info:', (error as Error).message);
    return [];
  }
};

const fetchHyperliquid: InstrumentFetcher = async () => {
  try {
    const { data } = await axios.post('https://api.hyperliquid.xyz/info', {
      type: 'meta',
    });

    const assets = Array.isArray(data?.universe) ? data.universe : [];

    return assets.map((asset: any) => {
      const symbol = sanitize(asset?.name) ?? sanitize(asset?.symbol);
      const base = sanitize(asset?.symbol) ?? sanitize(asset?.token);
      const quote = 'USD';

      const standardized: StandardizedInstrument = {
        unique_id: `hyperliquid:${symbol ?? base ?? asset?.id}`,
        exchange: 'hyperliquid',
        symbol: symbol ?? undefined,
        base_asset: base,
        quote_asset: quote,
        category_tags: [],
        raw: asset,
      };

      standardized.category_tags = buildTags(standardized, [asset?.name, asset?.description]);
      return standardized;
    });
  } catch (error) {
    console.error('[hyperliquid] Failed to fetch universe metadata:', (error as Error).message);
    return [];
  }
};

const fetchPolymarket: InstrumentFetcher = async () => {
  try {
    const query = `
      query ActiveMarkets($first: Int!) {
        markets(first: $first, order: endDate, filter: { active: true }) {
          nodes {
            id
            question
            questionSlug
            outcomeAssets
            categories
            collectionSlug
            collectionTitle
          }
        }
      }
    `;

    const { data } = await axios.post(
      'https://gamma.polymarket.com/api/graphql',
      {
        query,
        variables: { first: 500 },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const nodes: Array<Record<string, any>> = Array.isArray(data?.data?.markets?.nodes)
      ? data.data.markets.nodes
      : [];

    return nodes.map((node) => {
      const symbol = sanitize(node?.questionSlug) ?? sanitize(node?.id);
      const standardized: StandardizedInstrument = {
        unique_id: `polymarket:${node?.id}`,
        exchange: 'polymarket',
        symbol: symbol ?? undefined,
        base_asset: sanitize(node?.collectionTitle) ?? undefined,
        quote_asset: 'USDC',
        event_id: sanitize(node?.id),
        category_tags: Array.isArray(node?.categories)
          ? node.categories.filter(Boolean).map((category: string) => category.toLowerCase())
          : [],
        raw: node,
      };

      standardized.category_tags = buildTags(standardized, [node?.question, node?.collectionTitle]);
      return standardized;
    });
  } catch (error) {
    console.error('[polymarket] Failed to fetch markets:', (error as Error).message);
    return [];
  }
};

const dedupeInstruments = (instruments: StandardizedInstrument[]): StandardizedInstrument[] => {
  const map = new Map<string, StandardizedInstrument>();
  for (const instrument of instruments) {
    if (!map.has(instrument.unique_id)) {
      map.set(instrument.unique_id, instrument);
    }
  }
  return Array.from(map.values());
};

const csvEscape = (value: string): string => {
  const needsQuoting = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
};

const writeCsv = async (instruments: StandardizedInstrument[], filePath: string): Promise<boolean> => {
  const header = ['unique_id', 'exchange', 'symbol', 'base_asset', 'quote_asset', 'event_id', 'category_tags'];
  const rows = instruments.map((instrument) =>
    [
      instrument.unique_id,
      instrument.exchange,
      instrument.symbol ?? '',
      instrument.base_asset ?? '',
      instrument.quote_asset ?? '',
      instrument.event_id ?? '',
      instrument.category_tags.join('|'),
    ].map((value) => csvEscape(value)).join(','),
  );

  const content = `${[header.map((value) => csvEscape(value)).join(','), ...rows].join('\n')}\n`;
  await fs.writeFile(filePath, content, 'utf8');
  return true;
};

const writeParquet = async (instruments: StandardizedInstrument[], filePath: string): Promise<boolean> => {
  try {
    const parquet = await import('parquetjs-lite');
    const { ParquetSchema, ParquetWriter } = parquet as any;

    const schema = new ParquetSchema({
      unique_id: { type: 'UTF8' },
      exchange: { type: 'UTF8' },
      symbol: { type: 'UTF8', optional: true },
      base_asset: { type: 'UTF8', optional: true },
      quote_asset: { type: 'UTF8', optional: true },
      event_id: { type: 'UTF8', optional: true },
      category_tags: { type: 'UTF8', optional: true },
    });

    const writer = await ParquetWriter.openFile(schema, filePath);
    for (const instrument of instruments) {
      await writer.appendRow({
        unique_id: instrument.unique_id,
        exchange: instrument.exchange,
        symbol: instrument.symbol ?? null,
        base_asset: instrument.base_asset ?? null,
        quote_asset: instrument.quote_asset ?? null,
        event_id: instrument.event_id ?? null,
        category_tags: instrument.category_tags.join('|'),
      });
    }
    await writer.close();
    return true;
  } catch (error) {
    const message = (error as Error)?.message ?? '';
    if (
      message.includes('Cannot find module') ||
      message.includes('Cannot find package') ||
      message.includes('ERR_MODULE_NOT_FOUND')
    ) {
      console.warn('[parquet] Module not available. Skipping Parquet export.');
      return false;
    }

    console.error('[parquet] Failed to write Parquet file:', message);
    return false;
  }
};

const main = async () => {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const fetchers: Array<[string, InstrumentFetcher]> = [
    ['binance', fetchBinance],
    ['hyperliquid', fetchHyperliquid],
    ['polymarket', fetchPolymarket],
  ];

  const results: StandardizedInstrument[] = [];
  for (const [name, fetcher] of fetchers) {
    console.log(`Fetching listings from ${name}...`);
    const instruments = await fetcher();
    console.log(`  -> ${instruments.length} instruments`);
    results.push(...instruments);
  }

  const deduped = dedupeInstruments(results).map((instrument) => ({
    ...instrument,
    category_tags: Array.from(new Set(instrument.category_tags)).sort(),
  }));

  const csvPath = path.join(OUTPUT_DIR, 'tradable_instruments.csv');
  const parquetPath = path.join(OUTPUT_DIR, 'tradable_instruments.parquet');

  const csvWritten = await writeCsv(deduped, csvPath);
  const parquetWritten = await writeParquet(deduped, parquetPath);

  console.log(`Saved ${deduped.length} instruments to:`);
  if (csvWritten) {
    console.log(`  CSV: ${csvPath}`);
  }
  if (parquetWritten) {
    console.log(`  Parquet: ${parquetPath}`);
  }
};

main().catch((error) => {
  console.error('Failed to build tradable instrument catalog:', error);
  process.exitCode = 1;
});
