package finmind

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	"github.com/shopspring/decimal"
)

type TaiwanExchangeRateGetter interface {
	GetExchangeRate(code string) (decimal.Decimal, error)
}

type client struct {
	httpClient *http.Client
}

func NewClient() TaiwanExchangeRateGetter {
	return &client{
		httpClient: &http.Client{
			Timeout: time.Second * 10,
		},
	}
}

func (c *client) GetExchangeRate(code string) (decimal.Decimal, error) {
	reqUrl := url.URL{
		Scheme: "https",
		Host:   "api.finmindtrade.com",
		Path:   "/api/v3/data",
		RawQuery: url.Values{
			"dataset": {"TaiwanExchangeRate"},
			"data_id": {code},
			"date":    {time.Now().AddDate(0, 0, -1).Format("2006-01-02")},
		}.Encode(),
	}
	slog.Info("getExchangeRate", "code", code, "url", reqUrl.String())
	resp, err := c.httpClient.Get(reqUrl.String())
	if err != nil {
		return decimal.Zero, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		io.Copy(io.Discard, resp.Body)
		return decimal.Zero, fmt.Errorf("receive status: %s", resp.Status)
	}
	var response Response
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return decimal.Zero, err
	}
	if len(response.Data) == 0 {
		if (response.Status != 200) && (response.Msg == "success") {
			return decimal.Zero, fmt.Errorf("got response status: %d %s", response.Status, response.Msg)
		}
		return decimal.NewFromInt(1), nil
	}
	return decimal.NewFromFloat(response.Data[0].CashSell), nil
}

type Response struct {
	Msg    string `json:"msg"`
	Status int    `json:"status"`
	Data   []struct {
		Date     string  `json:"date"`
		Currency string  `json:"currency"`
		CashBuy  float64 `json:"cash_buy"`
		CashSell float64 `json:"cash_sell"`
		SpotBuy  float64 `json:"spot_buy"`
		SpotSell float64 `json:"spot_sell"`
	} `json:"data"`
}

// {
//   "msg": "success",
//   "status": 200,
//   "data": [
//     {
//       "date": "2024-05-08",
//       "currency": "USD",
//       "cash_buy": 32.01,
//       "cash_sell": 32.68,
//       "spot_buy": 32.36,
//       "spot_sell": 32.46
//     }
//   ]
// }
