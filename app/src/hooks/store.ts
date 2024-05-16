import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const accessTokenAtom = atomWithStorage<string | null>("access_token", null, {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => {
    console.log(`setAccessToken`, key, value)
    if (!value) {
      return localStorage.removeItem(key)
    }
    return localStorage.setItem(key, value)
  },
  removeItem: (key) => localStorage.removeItem(key),
}, {
  getOnInit: true
})

export const useAccessToken = () => useAtom(accessTokenAtom);

export const lastUsedCurrencyAtom = atomWithStorage<string | null>("last_used_currency", null, undefined, { getOnInit: true })
export const useLastUsedCurrency = () => useAtom(lastUsedCurrencyAtom);