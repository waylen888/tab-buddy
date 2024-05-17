import { useNavigate } from "react-router-dom"

export default function () {
  const navigate = useNavigate()
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page</p>
      <button onClick={() => {
        navigate(-1)
      }}>back</button>
    </div>
  )
}