package entity

type Currency struct {
	Code          string
	Name          string
	NamePlural    string
	Symbol        string
	SymbolNative  string
	DecimalDigits int
	Rounding      int
}
