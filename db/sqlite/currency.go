package sqlite

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/georgysavva/scany/v2/sqlscan"
	"github.com/waylen888/tab-buddy/db/entity"
)

func (s *sqlite) GetCurrency(code string) (entity.Currency, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()
	var c entity.Currency
	return c, sqlscan.Get(
		ctx, s.rwDB, &c,
		`SELECT * FROM "currency" WHERE code = @code`,
		sql.Named("code", code),
	)
}

func (s *sqlite) GetCurrencies() ([]entity.Currency, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()
	cs := make([]entity.Currency, 0)
	return cs, sqlscan.Select(ctx, s.rwDB, &cs, `SELECT * FROM "currency"`)
}

func (s *sqlite) prepareCurrency(ctx context.Context, tx *sql.Tx) error {
	_, err := tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS "currency" (
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(35) NOT NULL,
    "name_plural" VARCHAR(36) NOT NULL,
    "symbol" VARCHAR(5) NOT NULL,
    "symbol_native" VARCHAR(5) NOT NULL,
    "decimal_digits" INTEGER  NOT NULL,
    "rounding" INTEGER NOT NULL,
		PRIMARY KEY("code")
);`)
	if err != nil {
		return fmt.Errorf("create table: %w", err)
	}

	_, _ = tx.ExecContext(ctx,
		`INSERT INTO currency(code,name,name_plural,symbol,symbol_native,decimal_digits,rounding) VALUES
    ('EUR','歐元','euros','€','€',2,0),
    ('USD','美元','US dollars','$','$',2,0),
    ('AUD','澳大利亞元','Australian dollars','AU$','$',2,0),
    ('CAD','加拿大元 Dollar','Canadian dollars','CA$','$',2,0),
    ('CHF','瑞士法郎','Swiss francs','CHF','CHF',2,0),
    ('NZD','紐西蘭元','New Zealand dollars','NZ$','$',2,0),
    ('CNY','人民幣','Chinese yuan','CN¥','CN¥',2,0),
    ('HKD','港元','Hong Kong dollars','HK$','$',2,0),
    ('JPY','日圓','Japanese yen','¥','￥',0,0),
    ('KRW','韓元','South Korean won','₩','₩',0,0),
    ('TWD','新台幣','New Taiwan dollars','NT$','NT$',2,0)
	`)
	return err
}
