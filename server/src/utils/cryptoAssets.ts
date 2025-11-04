export interface CryptoAsset {
  symbol: string;
  name: string;
  aliases: string[];
}

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', aliases: ['bitcoin', 'btc', 'satoshis', 'btcusd'] },
  { symbol: 'ETH', name: 'Ethereum', aliases: ['ethereum', 'eth', 'ethusd', 'ether'] },
  { symbol: 'SOL', name: 'Solana', aliases: ['solana', 'sol', 'solusd'] },
  { symbol: 'BNB', name: 'Binance Coin', aliases: ['bnb', 'binance coin'] },
  { symbol: 'XRP', name: 'XRP', aliases: ['xrp', 'ripple'] },
  { symbol: 'ADA', name: 'Cardano', aliases: ['ada', 'cardano'] },
  { symbol: 'DOGE', name: 'Dogecoin', aliases: ['dogecoin', 'doge'] },
  { symbol: 'DOT', name: 'Polkadot', aliases: ['polkadot', 'dot'] },
  { symbol: 'MATIC', name: 'Polygon', aliases: ['polygon', 'matic'] },
  { symbol: 'AVAX', name: 'Avalanche', aliases: ['avax', 'avalanche'] },
  { symbol: 'ARB', name: 'Arbitrum', aliases: ['arb', 'arbitrum'] },
  { symbol: 'OP', name: 'Optimism', aliases: ['op', 'optimism'] },
  { symbol: 'LTC', name: 'Litecoin', aliases: ['ltc', 'litecoin'] },
  { symbol: 'ATOM', name: 'Cosmos', aliases: ['atom', 'cosmos'] },
  { symbol: 'NEAR', name: 'NEAR Protocol', aliases: ['near', 'near protocol'] },
  { symbol: 'AAVE', name: 'Aave', aliases: ['aave'] },
  { symbol: 'UNI', name: 'Uniswap', aliases: ['uni', 'uniswap'] },
  { symbol: 'SUI', name: 'Sui', aliases: ['sui'] },
  { symbol: 'TIA', name: 'Celestia', aliases: ['tia', 'celestia'] },
  { symbol: 'LINK', name: 'Chainlink', aliases: ['link', 'chainlink'] },
];

export const assetAliasMap: Record<string, CryptoAsset> = CRYPTO_ASSETS.reduce(
  (acc, asset) => {
    asset.aliases.forEach((alias) => {
      acc[alias.toLowerCase()] = asset;
    });
    acc[asset.symbol.toLowerCase()] = asset;
    return acc;
  },
  {} as Record<string, CryptoAsset>
);
