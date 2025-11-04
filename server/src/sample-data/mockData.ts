import dayjs from 'dayjs';

export interface MockUserProfile {
  twitter_handle: string;
  user_id: string;
  display_name: string;
  profile: {
    bio: string;
    followers_count: number;
    following_count: number;
    verified: boolean;
    profile_image_url: string;
  };
}

export interface MockTweet {
  id: string;
  text: string;
  created_at: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
  media: string[];
  urls: string[];
}

export const mockFollowings: MockUserProfile[] = [
  {
    twitter_handle: 'InfoEchoes',
    user_id: '10001',
    display_name: 'Info Echoes',
    profile: {
      bio: 'Curated insights on crypto assets and macro trends.',
      followers_count: 15432,
      following_count: 512,
      verified: true,
      profile_image_url: 'https://example.com/infoechoes.jpg',
    },
  },
  {
    twitter_handle: 'DeFiInsights',
    user_id: '10002',
    display_name: 'DeFi Insights',
    profile: {
      bio: 'Daily alpha on DeFi, yield opportunities and governance.',
      followers_count: 9832,
      following_count: 421,
      verified: false,
      profile_image_url: 'https://example.com/defi.jpg',
    },
  },
  {
    twitter_handle: 'NFTOracle',
    user_id: '10003',
    display_name: 'NFT Oracle',
    profile: {
      bio: 'Tracking premium NFT drops, artists and DAOs.',
      followers_count: 6401,
      following_count: 301,
      verified: false,
      profile_image_url: 'https://example.com/nft.jpg',
    },
  },
];

export const mockTweetsByHandle: Record<string, MockTweet[]> = {
  InfoEchoes: [
    {
      id: '20001',
      text: 'BTC consolidation around $70k with declining exchange balances. Bullish continuation setup remains intact. Watching for a clean break above 71.5k before adding. #BTC #crypto',
      created_at: dayjs().subtract(30, 'minute').toISOString(),
      metrics: { likes: 120, retweets: 45, replies: 18, views: 15234 },
      media: [],
      urls: [],
    },
    {
      id: '20002',
      text: 'SOL ecosystem seeing renewed developer momentum. New DeFi primitives launching with TVL up 25% w/w. Keeping alerts on SOL and key ecosystem tokens. #Solana #SOL',
      created_at: dayjs().subtract(3, 'hour').toISOString(),
      metrics: { likes: 80, retweets: 30, replies: 12, views: 9832 },
      media: [],
      urls: [],
    },
    {
      id: '20003',
      text: 'ETH staking inflows hit record highs again. With Dencun live, L2 fees remain low which should support higher activity. Maintain core holdings. #Ethereum #ETH',
      created_at: dayjs().subtract(8, 'hour').toISOString(),
      metrics: { likes: 95, retweets: 25, replies: 10, views: 11234 },
      media: [],
      urls: [],
    },
    {
      id: '20004',
      text: 'Watching MATIC as Polygon CDK adoption rises. Institutional partnerships in the pipeline per our sources, but need confirmation before acting.',
      created_at: dayjs().subtract(1, 'day').toISOString(),
      metrics: { likes: 60, retweets: 20, replies: 9, views: 7034 },
      media: [],
      urls: [],
    },
    {
      id: '20005',
      text: 'Macro: US CPI print came in line with expectations. Risk-on sentiment intact; keeping watch on BTC and ETH dominance next 48h.',
      created_at: dayjs().subtract(2, 'day').toISOString(),
      metrics: { likes: 70, retweets: 22, replies: 7, views: 8123 },
      media: [],
      urls: [],
    },
  ],
  DeFiInsights: [
    {
      id: '21001',
      text: 'New yield strategy on Aave v3 using USDC vaults yields 12% APY. Backtested for 60 days, drawdown under 4%. Worth a look for conservative degen plays. #DeFi #AAVE',
      created_at: dayjs().subtract(2, 'hour').toISOString(),
      metrics: { likes: 45, retweets: 12, replies: 5, views: 4632 },
      media: [],
      urls: ['https://mirror.xyz/analysis'],
    },
    {
      id: '21002',
      text: 'ARB incentives renewed for GMX v2 pools. Expect TVL to climb as traders rotate back. Monitoring perp funding spreads. #Arbitrum #ARB',
      created_at: dayjs().subtract(5, 'hour').toISOString(),
      metrics: { likes: 38, retweets: 9, replies: 3, views: 3521 },
      media: [],
      urls: [],
    },
  ],
};

export const getMockFollowingsForHandle = (handle: string) => {
  if (handle.toLowerCase() === 'infoechoes') {
    return mockFollowings.filter((user) => user.twitter_handle !== 'InfoEchoes');
  }
  return mockFollowings;
};

export const getMockTweetsForHandle = (handle: string) => {
  return mockTweetsByHandle[handle] || [];
};
