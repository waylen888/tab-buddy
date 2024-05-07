package model

type Currency struct {
	Code          string `json:"code"`
	Name          string `json:"name"`
	NamePlural    string `json:"namePlural"`
	Symbol        string `json:"symbol"`
	SymbolNative  string `json:"symbolNative"`
	DecimalDigits int    `json:"decimalDigits"`
	Rounding      int    `json:"rounding"`
}
