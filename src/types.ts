export interface PairsResponse {
  schemaVersion: string;
  pairs: Pair[];
}

export interface Pair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: [string];
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  info: {
    imageUrl: string;
    websites: [
      {
        url: string;
      }
    ];
    socials: [
      {
        platform: string;
        handle: string;
      }
    ];
  };
  boosts: {};
}

export type Message = {
  message: string;
  timestamp: number;
  onchain: boolean;
  tweeted: boolean;
  tweetId: string;
  emotion: string;
  growth: string;
  blocknumber: number;
  txHash: string;
  price: string;
  mcap: number;
  holders: number;
  treasury: number;
};
