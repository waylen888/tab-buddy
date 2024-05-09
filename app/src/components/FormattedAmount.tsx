import { CSSProperties } from "react";
import { Currency } from "../model";

const FormattedAmount: React.FC<{
  currency: Currency;
  value: string | null;
  style?: CSSProperties | undefined
}> = ({ currency, value, style }) => {
  const nf = Intl.NumberFormat(undefined, { style: "currency", currency: currency.code })
  return (
    <span style={style}> {nf.format(+value)}</span>
  )
}

export default FormattedAmount;