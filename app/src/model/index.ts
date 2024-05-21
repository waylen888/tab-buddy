export interface Group {
  id: string
  name: string
  convertToTwd: boolean;
  createAt: string
  updateAt: string
}

export interface Expense {
  id: string
  amount: string
  description: string
  date: string
  category: string
  currency: Currency
  createAt: string
  updateAt: string
  createdBy: User
}

export interface ExpenseAttachment {
  id: string
  filename: string
  size: number;
  mime: string;
  createAt: string;
  updateAt: string;
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

export interface UserSetting {
  themeMode: string;
  pushNotification: boolean;
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

export interface Comment {
  id: string
  content: string
  createBy: string
  displayName: string
  createAt: string
  updateAt: string
}