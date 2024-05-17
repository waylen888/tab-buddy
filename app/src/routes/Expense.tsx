import { HTMLAttributes, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useAuthFetch } from "../hooks/api"
import { ExpensePhoto, ExpenseWithSplitUsers } from "../model"
import { Button, CircularProgress, Divider, IconButton, Stack, Typography } from "@mui/material"
import dayjs from "dayjs"
import Comments from "./Comments"
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import FormattedAmount from "../components/FormattedAmount"
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import imageCompression from "browser-image-compression";
import { PhotoProvider, PhotoView } from "react-photo-view";
import 'react-photo-view/dist/react-photo-view.css';
import { PhotoRenderParams } from "react-photo-view/dist/types";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { NavBackButton, NavLeftToolBar, NavRightToolBar } from "../components/NavBar";


export default function Expense() {

  const { expenseId } = useParams<{ expenseId: string }>()
  const authFetch = useAuthFetch()
  const { data, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => {
      return authFetch<ExpenseWithSplitUsers>(`/api/expense/${expenseId}`)
    }
  })
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading || !data) {
    return <CircularProgress />
  }

  return (
    <Stack gap={2}>
      <NavLeftToolBar>
        <NavBackButton />
      </NavLeftToolBar>
      <NavRightToolBar>
        <IconButton size="large" color="inherit" onClick={() => navigate("edit")}>
          <ModeEditIcon />
        </IconButton>
      </NavRightToolBar>

      <Stack sx={{ p: 1 }}>
        <Stack direction="row" gap={2} alignItems="center">
          <Typography variant="h4">{data?.description}</Typography>
          <ImageUploadButton />
        </Stack>

        <Typography>
          <FormattedAmount currency={data.currency} value={data.amount} />
        </Typography>

        <Photos />
        <Typography variant="caption">
          {t("expense.added_by_on", {
            name: data?.createdBy?.displayName,
            date: dayjs(data?.createAt).format("YYYY/MM/DD"),
          })}
        </Typography>
      </Stack>
      <Divider />
      <Comments />
      <Outlet />
    </Stack >
  )
}

const Photos: React.FC<{}> = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ["expense", expenseId, "photos"],
    queryFn: () => {
      return authFetch<ExpensePhoto[]>(`/api/expense/${expenseId}/photos`)
    }
  })
  return (
    <PhotoProvider toolbarRender={() => {
      return (
        <AddPhotoAlternateIcon onClick={() => { alert("delete?") }} />
      )
    }}>
      <Stack direction="row" gap={2} sx={{
        overflowY: "auto",
      }}>
        {
          data?.map((photo,) => (<Photo key={photo.id} photo={photo} />))
        }
      </Stack>
    </PhotoProvider>
  )
}

const Photo: React.FC<{
  photo: ExpensePhoto
}> = ({ photo }) => {
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ["static", "photo", photo.id],
    queryFn: () => {
      return authFetch(`/static/photo/${photo.id}`, {
        handleResponse: (response) => response.blob().then((value) => URL.createObjectURL(value))
      })
    }
  })

  return (
    <PhotoView src={data}>
      <img
        src={data}
        width={100}
        height={100}
        style={{
          objectFit: "cover",
          border: "1px solid #000",
        }}
        alt=""
      />
    </PhotoView >
  )
}

const BigPhoto: React.FC<{
  photo: ExpensePhoto
} & HTMLAttributes<HTMLDivElement> & PhotoRenderParams> = ({ photo, scale, ...attrs }) => {
  const authFetch = useAuthFetch()
  const { data, isLoading } = useQuery({
    queryKey: ["static", "photo", photo.id],
    queryFn: () => {
      return authFetch(`/static/photo/${photo.id}`, {
        handleResponse: (response) => response.blob().then((value) => URL.createObjectURL(value))
      })
    }
  })
  if (isLoading) {
    return <CircularProgress />
  }
  console.log(`attrs.style?.width`, attrs.style?.width);

  const elementSize = 400
  const width = attrs.style?.width ?? 400;
  const offset = (width as number - elementSize) / elementSize;
  const childScale = scale === 1 ? scale + offset : 1 + offset;

  return (
    <div {...attrs}>
      <div style={{ transform: `scale(${childScale})`, transformOrigin: '0 0' }}>
        <img src={data} />
      </div>
    </div>
  )
}

const ImageUploadButton = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const authFetch = useAuthFetch()
  const { mutateAsync } = useMutation({
    mutationFn: async (formData: FormData) => {
      return await authFetch(`/api/expense/${expenseId}/photos`, {
        method: "POST",
        body: formData
      })
    }, onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['expense', expenseId, 'photos'],
      })
    },
  })

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (files) {
        const formData = new FormData()
        for (const file of files) {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
            fileType: "image/webp",
          });
          formData.append('photo', compressedFile, file.name)
        }
        await mutateAsync(formData)
      }
      e.target.value = ''; // cleanup
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: "error" })
    }
  }

  return (
    <>
      <IconButton component="label">
        <AddPhotoAlternateIcon />
        <input
          type="file"
          accept="image/*"
          id="camera"
          hidden
          multiple
          onChange={handleSelectFile}
        />
      </IconButton>
    </>
  )
}
