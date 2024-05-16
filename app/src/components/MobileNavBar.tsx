import { atom, useSetAtom } from "jotai"
import { Outlet, useNavigate } from "react-router-dom"

export const navAtom = atom<{
  handleBackButton?: () => void
}>({})

