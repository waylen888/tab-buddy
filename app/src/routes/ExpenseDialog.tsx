import { Autocomplete, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { authFetch } from "../hooks/api";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from "dayjs";
import { LoadingButton } from "@mui/lab";
import CloseIcon from '@mui/icons-material/Close';
import { Currency, User } from "../model";
import { useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import NumericFormatCustom from "../components/NumericFormat";

interface ExpenseCreateForm {
  description: string;
  amount: string;
  date: Dayjs;
  currency: Currency;
  allocationMethod: string
  splitUsers: SplitUser[];
}

interface SplitUser extends User {
  include: boolean;
  paid: boolean;
}

export default function ExpenseDialog() {
  const navigate = useNavigate()
  const { id: groupId } = useParams<{ id: string }>()
  const { enqueueSnackbar } = useSnackbar()
  const methods = useForm<ExpenseCreateForm>({})

  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: ExpenseCreateForm) => {
      return authFetch(`/api/group/${groupId}/expense`, {
        method: 'POST',
        body: JSON.stringify({
          description: values.description,
          amount: values.amount,
          date: values.date,
          currency: values.currency.code,
          splitUsers: values.splitUsers.filter(user => user.include),
        })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['group', groupId, 'expenses']
      })
    },
  })

  const handleSubmit = async (values: ExpenseCreateForm) => {
    try {
      console.debug(`submit`, values)
      await mutateAsync(values)
      navigate(-1)
      enqueueSnackbar(`expense created`, { variant: 'success' })
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' })
    } finally {
    }
  }
  const handleClose = () => {
    navigate(-1)
  }
  return (
    <Dialog open fullScreen>
      <DialogTitle>
        Expense
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>
          <DialogContent dividers>
            <Stack gap={2}>
              <CurrencyField />
              <AmountField />
              <Controller
                name="description"
                control={methods.control}
                defaultValue=""
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="Description"
                  />
                )}
              />
              <Controller
                name="date"
                control={methods.control}
                defaultValue={dayjs()}
                rules={{ required: true }}
                render={({ field }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      {...field}
                      format="YYYY/MM/DD"
                    />
                  </LocalizationProvider>
                )}
              />
              {groupId ? <PaymentOptions groupId={groupId} /> : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <LoadingButton
              type="submit"
              loading={methods.formState.isSubmitting}
              disabled={methods.formState.isSubmitting || !methods.formState.isValid || isPending}
            >
              Create
            </LoadingButton>
          </DialogActions>

        </form>
      </FormProvider>
    </Dialog >
  )
}


const CurrencyField = () => {
  const { control } = useFormContext<ExpenseCreateForm>()
  const { data, isLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => authFetch<Currency[]>('/api/currencies'),
  })
  if (isLoading) {
    return <CircularProgress />
  }
  const defaultValue = data?.find((currency) => currency.code === localStorage.getItem("lastUsedCurrency"))
    ?? data?.[0];

  return (
    <Controller
      name="currency"
      control={control}
      defaultValue={defaultValue}
      rules={{ required: true }}
      render={({ field }) => (
        <Autocomplete
          {...field}
          onFocus={(e) => {
            document.body.scrollTop = e.target.offsetTop
          }}
          options={data || []}
          // value={data?.find(currency => currency.code === field.value)}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          renderInput={(params) => <TextField {...params} placeholder="Currency" />}
          getOptionLabel={(option) => `${option.code} - ${option.name}`}
          onChange={(_, value) => {
            if (value) {
              field.onChange(value)
              localStorage.setItem("lastUsedCurrency", value.code)
            }
          }}
        />
      )}
    />
  )
}

const AmountField = () => {
  const { control } = useFormContext<ExpenseCreateForm>()

  return (
    <Controller
      name="amount"
      control={control}
      defaultValue=""
      rules={{ required: true }}
      render={({ field }) => (
        <TextField
          {...field}
          placeholder="0.00"
          InputProps={{
            inputComponent: NumericFormatCustom as any,
          }}
          inputProps={{
            inputMode: "decimal",
          }}
        />
      )}
    />
  )
}


const PaymentOptions: React.FC<{
  groupId: string
}> = ({ groupId }) => {
  const { watch, setValue, control } = useFormContext<ExpenseCreateForm>()
  const { data } = useQuery({
    queryKey: ['group', groupId, 'members'],
    queryFn: () => authFetch<User[]>(`/api/group/${groupId}/members`),
  })
  const { user: me } = useAuth();
  useEffect(() => {
    if (data) {
      const splitUsers = data.map((user) => ({
        ...user,
        include: true,
        paid: user.id === me.id
      }))
      console.debug(`splitUsers`, splitUsers)
      setValue("splitUsers", splitUsers)
    }
  }, [data, me]);

  const amount = Number(watch("amount") || "0")
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell>Name</TableCell>
            <TableCell>
              <Controller
                name="allocationMethod"
                control={control}
                defaultValue="equally"
                render={({ field }) => (
                  <Select {...field} size="small">
                    <MenuItem value="equally">Equally</MenuItem>
                    <MenuItem value="percentage">Percentage</MenuItem>
                  </Select>
                )}
              />
            </TableCell>
            {/* <TableCell padding="checkbox">
              Paid?
            </TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {
            watch("splitUsers")?.map((user, index, array) => (
              <TableRow key={user.id}>
                <TableCell padding="checkbox">
                  <Controller
                    name={`splitUsers.${index}.include`}
                    control={control}
                    render={({ field }) => <Checkbox {...field} checked={field.value} />}
                  />
                </TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>
                  <Amount
                    value={user.include
                      ? amount / array.filter(user => user.include).length
                      : 0
                    } />
                </TableCell>
                {/* <TableCell padding="checkbox">
                  <Controller
                    name={`splitUsers.${index}.paid`}
                    control={control}
                    render={({ field }) => <Checkbox {...field} checked={field.value} />}
                  />
                </TableCell> */}
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const Amount: React.FC<{ value: number }> = ({ value }) => {
  const { watch } = useFormContext<ExpenseCreateForm>()
  const currency = watch("currency")
  return (
    <>{currency?.symbol} {value.toFixed(currency?.decimalDigits)}</>
  )
}