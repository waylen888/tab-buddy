import { Autocomplete, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Radio, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, darken, lighten, styled, useMediaQuery, useTheme } from "@mui/material";
import { Controller, FormProvider, useForm, useFormContext } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuthFetch } from "../hooks/api";
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
import FormattedAmount from "../components/FormattedAmount";
import { CATEGORIES, getCategory, getCategoryGroup } from "../components/CategoryIcon";
import Grid from "@mui/material/Grid";
import { useTranslation } from "react-i18next";
import { useLastUsedCurrency } from "../hooks/store";
import DialogCloseButton from "../components/DialogCloseButton";


interface ExpenseFormValues {
  description: string;
  amount: string;
  date: Dayjs;
  category: string;
  currency: Currency;
  allocationMethod: string
  splitUsers: SplitUser[];
  payerId: string;
}

interface SplitUser extends User {
  owed: boolean;
  // paid: boolean;
}

export default function ExpenseCreateDialog() {
  const navigate = useNavigate()
  const { groupId } = useParams<{ groupId: string }>()
  const { enqueueSnackbar } = useSnackbar()
  const methods = useForm<ExpenseFormValues>({})
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const authFetch = useAuthFetch()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      return authFetch(`/api/group/${groupId}/expense`, {
        method: 'POST',
        body: JSON.stringify({
          description: values.description,
          amount: values.amount,
          date: values.date,
          category: values.category,
          currencyCode: values.currency.code,
          splitUsers: values.splitUsers.map((user) => ({
            ...user,
            paid: values.payerId === user.id,
          })),
        })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['group', groupId, 'expenses']
      })
    },
  })

  const handleSubmit = async (values: ExpenseFormValues) => {
    try {
      console.debug(`submit`, values)
      await mutateAsync(values)
      navigate("..")
      enqueueSnackbar(`expense created`, { variant: 'success' })
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: 'error' })
    } finally {
    }
  }
  const handleClose = () => {
    navigate("..")
  }

  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (

    <Dialog open fullScreen={fullScreen}>
      <DialogTitle>
        {t("expense.create_dialog.title")}
      </DialogTitle>

      <DialogCloseButton onClick={handleClose} />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)} style={{ display: "contents" }}>

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
              <CategoryField />
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
              {t("expense.create_dialog.submit_button")}
            </LoadingButton>
          </DialogActions>
        </form>
      </FormProvider >
    </Dialog>
  )
}


const CurrencyField = () => {
  const { control } = useFormContext<ExpenseFormValues>()
  const authFetch = useAuthFetch()
  const { data, isLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => authFetch<Currency[]>('/api/currencies'),
  })
  const [lastUsedCurrency, setLastUsedCurrency] = useLastUsedCurrency()
  if (isLoading) {
    return <CircularProgress />
  }
  const defaultValue = data?.find((currency) => currency.code === lastUsedCurrency)
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
              setLastUsedCurrency(value.code)
            }
          }}
        />
      )}
    />
  )
}

const AmountField = () => {
  const { control } = useFormContext<ExpenseFormValues>()

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
  const { watch, setValue, control } = useFormContext<ExpenseFormValues>()
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ['group', groupId, 'members'],
    queryFn: () => authFetch<User[]>(`/api/group/${groupId}/members`),
  })
  const { user: me } = useAuth();
  useEffect(() => {
    if (data) {
      const splitUsers = data.map((user) => ({
        ...user,
        owed: true,
      }))
      console.debug(`splitUsers`, splitUsers)
      setValue("splitUsers", splitUsers)
      setValue("payerId", me.id)
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
            <TableCell padding="checkbox">
              Paid?
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            watch("splitUsers")?.map((user, index, array) => (
              <TableRow key={user.id}>
                <TableCell padding="checkbox">
                  <Controller
                    name={`splitUsers.${index}.owed`}
                    control={control}
                    defaultValue={true}
                    render={({ field }) => <Checkbox {...field} checked={field.value} />}
                  />
                </TableCell>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>
                  <Amount
                    value={user.owed
                      ? amount / array.filter(user => user.owed).length
                      : 0
                    } />
                </TableCell>
                <TableCell padding="checkbox">
                  <Controller
                    name={`payerId`}
                    control={control}
                    render={({ field }) => (
                      <Radio
                        checked={field.value === user.id}
                        onChange={(_, checked) => {
                          field.onChange(checked ? user.id : "")
                        }}
                      />
                    )}
                  />
                </TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const Amount: React.FC<{ value: number }> = ({ value }) => {
  const { watch } = useFormContext<ExpenseFormValues>()
  const currency = watch("currency")
  if (!currency) {
    return <CircularProgress size="12px" />
  }
  return (
    <FormattedAmount currency={currency} value={value} />
  )
}


const CategoryField = () => {
  const { control } = useFormContext<ExpenseFormValues>()
  const options = CATEGORIES.map(sub => sub.subCategories).flat()
  return (
    <Controller
      name="category"
      control={control}
      defaultValue=""
      render={({ field }) => (
        <Autocomplete
          {...field}
          options={options}
          isOptionEqualToValue={(option, value) => option.key === value.key}
          value={getCategory(field.value)}
          onChange={(_, category) => {
            if (category) {
              field.onChange(category.key)
            }
          }}
          renderInput={(params) => <TextField {...params} placeholder="Category"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  {getCategory(field.value)?.icon}
                </InputAdornment>
              ),
            }}
          />}
          getOptionLabel={(option) => option.name}
          renderOption={(props, option) => {
            return (
              <li {...props} key={option.key}>
                <Grid container alignItems="center">
                  <Grid sx={{ display: 'flex', width: 44 }}>
                    {option.icon}
                  </Grid>
                  <Grid sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                    <Typography variant="body2" color="text.secondary">
                      {option.name}
                    </Typography>
                  </Grid>
                </Grid>

              </li>
            )
          }}
          groupBy={(option) => getCategoryGroup(option.key)?.title ?? ""}
          renderGroup={(params) => (
            <li key={params.key}>
              <GroupHeader>{params.group}</GroupHeader>
              <GroupItems>{params.children}</GroupItems>
            </li>
          )}

        />
      )}
    />
  )
}

const GroupHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: '-8px',
  padding: '4px 10px',
  color: theme.palette.primary.main,
  backgroundColor:
    theme.palette.mode === 'light'
      ? lighten(theme.palette.primary.light, 0.85)
      : darken(theme.palette.primary.main, 0.8),
}));

const GroupItems = styled('ul')({
  padding: 0,
});

