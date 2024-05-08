package entity

type Debtor struct {
	User
	Amount string
}

type DebtByCurrency struct {
	Amount   string
	Currency Currency
	Debtors  []Debtor
}
