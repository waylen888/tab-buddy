export interface Group {
  id: string
  name: string
  createAt: string
  updateAt: string
}

export interface Expense {
  id: string
  amount: string
  description: string
  date: string
  createAt: string
  updateAt: string
  createdBy: User
}
export interface ExpenseWithSplitUsers extends Expense {
  splitUsers: SplitUser[]
}

export interface GroupExpense extends Expense {
  sum: string;
  currency: Currency;
  splitUsers: SplitUser[];
}

export interface SplitUser extends User {
  paid: boolean;
  owed: boolean;
  amount: string;
}

export interface User {
  id: string
  username: string
  displayName: string
  email: string
  createAt: string
  updateAt: string
}

export interface Currency {
  code: string
  name: string
  namePlural: string
  symbol: string
  symbolNative: string
  decimalDigits: number
  rounding: number
}