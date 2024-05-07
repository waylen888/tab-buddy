import { Button, CssBaseline, TextField, Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { User } from "../model";
import { Navigate, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { authFetch } from "../hooks/api";

interface LoginForm {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { mutateAsync } = useMutation({
    mutationFn: (data: LoginForm) => {
      return authFetch<{ token: string; user: User; }>(
        `/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    }
  })

  const methods = useForm<LoginForm>({
    defaultValues: {
      username: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const { token } = await mutateAsync(data)
      localStorage.setItem('access_token', token)
      navigate('/')
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' })
    }
  }

  if (localStorage.getItem('access_token')) {
    return <Navigate to="/" />
  }

  return (
    <>
      <CssBaseline />
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Stack sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'

          }}>
            <Stack gap={2}>
              <Controller
                name="username"
                control={methods.control}
                rules={{ required: true }}
                render={({ field }) => <TextField {...field} placeholder="Username" autoFocus />}
              />
              <Controller
                name="password"
                control={methods.control}
                rules={{ required: true }}
                render={({ field }) => <TextField {...field} type="password" placeholder="Password" />}
              />
              <Button type="submit">
                登入
              </Button>
            </Stack>
          </Stack>
        </form>
      </FormProvider>
    </>
  )
}

export default Login;