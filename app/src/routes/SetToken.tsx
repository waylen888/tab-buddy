
import { Navigate } from "react-router-dom";

const SetToken = () => {
  let urlParams = new URLSearchParams(window.location.search);
  console.debug("urlParams", urlParams)
  localStorage.setItem("access_token", urlParams.get('access_token'))
  return (
    <Navigate to="/" />
  )
}

export default SetToken;