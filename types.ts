
export interface User {
  username: string;
  mobile: string;
  uid: string;
}

export interface Bet {
  id: string;
  time: string;
  numbers: number[];
  amount: number;
  winNumber?: number;
  result: 'WIN' | 'LOSS' | 'PENDING';
  payout?: number;
}

export interface GameState {
  wallet: number;
  results: number[];
  betHistory: Bet[];
  time: number;
}
