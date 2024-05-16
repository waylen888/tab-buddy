import { Button, CssBaseline, TextField, Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { User } from "../model";
import { Navigate, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useAuthFetch } from "../hooks/api";
import { LoadingButton } from "@mui/lab";

import LoginIcon from '@mui/icons-material/Login';
import GoogleIcon from '@mui/icons-material/Google';
import { useAccessToken } from "../hooks/store";

interface LoginForm {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate()
  const [accessToken, setAccessToken] = useAccessToken()
  const { enqueueSnackbar } = useSnackbar()
  const authFetch = useAuthFetch()
  const { mutateAsync, isPending } = useMutation({
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
      setAccessToken(token)
      navigate('/')
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' })
    }
  }

  if (accessToken) {
    console.debug(`detect accessToken in local`, accessToken, typeof accessToken)
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
              <LoadingButton
                type="submit"
                variant="outlined"
                disabled={!methods.formState.isValid || isPending}
                loading={isPending}
                startIcon={<LoginIcon />}
              >
                登入
              </LoadingButton>
              <Button
                variant="outlined"
                onClick={() => {
                  window.location.href = '/google/oauth/login'
                }}
                disabled={isPending}
                startIcon={<GoogleIcon />}
              >
                Google登入
              </Button>
            </Stack>
          </Stack>
        </form>
      </FormProvider>
    </>
  )
}

export default Login;