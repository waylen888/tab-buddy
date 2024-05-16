
import { Navigate } from "react-router-dom";
import { useAccessToken } from "../hooks/store";
import { useEffect } from "react";

const SetToken = () => {
  let urlParams = new URLSearchParams(window.location.search);
  const setAccessToken = useAccessToken()[1]
  useEffect(() => {
    console.debug("urlParams", urlParams)
    if (urlParams.get('access_token')) {
      setAccessToken(urlParams.get('access_token'))
    }
  }, [urlParams])
  return (
    <Navigate to="/login" />
  )
}

export default SetToken;