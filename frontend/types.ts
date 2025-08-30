export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface Group {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  members: Array<{
    user: User;
    role?: string;
    joinedAt?: string;
  }>;
  expenses?: Expense[];
  totalExpenses?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  userRole?: string;
  isActive?: boolean;
}

export interface Expense {
  _id?: string;
  id?: string;
  description: string;
  amount: number;
  paidBy: User;
  group: string;
  category: string;
  date: string;
  splitBetween: Array<{
    user: User;
    amount: number;
  }>;
  settled?: boolean;
}

export interface SimplifiedBalance {
  from: string;
  to: string;
  amount: number;
  groupId?: string;
  groupName?: string;
}

export interface Settlement {
  from: {
    userId: string;
    name: string;
  };
  to: {
    userId: string;
    name: string;
  };
  amount: number;
  groupId: string;
  groupName: string;
}
