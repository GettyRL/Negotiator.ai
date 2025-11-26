export enum BattleStatus {
  ACTIVE = 'ACTIVE',
  WON = 'WON',
  LOST = 'LOST',
  PENDING = 'PENDING'
}

export interface Battle {
  id: string;
  vendorName: string;
  contractValue: number;
  savingsPotential: number;
  status: BattleStatus;
  lastMessage: string;
  coordinates: { x: number; y: number }; // For map visualization
  history: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
}

export interface RiskAnalysis {
  riskScore: number;
  clauses: {
    title: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

export interface Plan {
  name: string;
  price: string;
  features: string[];
}
