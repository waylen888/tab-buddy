import { useCallback } from "react"
import { useAccessToken } from "./store"

export const useAuthFetch = () => {
  const [token] = useAccessToken()

  return useCallback(<JSONResponse extends unknown>(
    input: RequestInfo | URL,
    init?: RequestInit & {
      handleResponse?: (res: Response) => Promise<JSONResponse>
    } | undefined,
  ): Promise<JSONResponse> => fetch(input, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "ngrok-skip-browser-warning": "1",
      ...init?.headers
    },
    ...init,
  }).then((res) => {
    if (res.status < 200 || res.status >= 300) {
      throw new Error(res.statusText)
    }

    if (init?.handleResponse) {
      return init.handleResponse(res)
    }

    if (res.headers.get("Content-Type")?.includes("application/json")) {
      return res.json()
    }
    return res.blob()
  }), [token])
}
