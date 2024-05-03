import { useLoaderData } from "react-router-typesafe"
import { Expense, Group } from "../model"
import { Link, Outlet, Params, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

export default function GroupRoute() {
  const data = useLoaderData<typeof loader>()
  const location = useLocation()
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ['group', data.id, 'expenses'],
    queryFn: () => fetch(`/api/group/${data.id}/expenses`).then(res => res.json())
  })
  return (
    <div>
      <h1>Group {data.name}</h1>
      <p>{data.createAt}</p>
      <p>{data.updateAt}</p>
      <Link to={`${location.pathname}/create/expense`}>
        Create Expense
      </Link>
      <h2>Expenses</h2>
      {expenses?.map(expense => (
        <div key={expense.id}>
          <Link to={`${location.pathname}/${expense.id}`}>{expense.description} ${expense.amount}</Link>
        </div>
      ))}
      <Outlet />
    </div>
  )
}

export const loader = async ({ params }: { params: Params }) => fetch(`/api/group/${params.id}`).then(res => res.json() as Promise<Group>)