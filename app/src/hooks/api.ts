
export const authFetch = <JSONResponse extends any>(
  input: RequestInfo | URL, init?: RequestInit & {
    handleResponse?: (res: Response) => Promise<JSONResponse>
  } | undefined,
): Promise<JSONResponse> => {
  const token = localStorage.getItem("access_token")
  return fetch(input, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "ngrok-skip-browser-warning": "1",
      ...init?.headers
    },
    ...init,
  }).then((res) => {
    if (res.status === 401) {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
    }
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
  })
}

export const useGetGroup = () => {

}