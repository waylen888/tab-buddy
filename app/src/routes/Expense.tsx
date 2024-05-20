import React, { HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useAuthFetch } from "../hooks/api"
import { ExpensePhoto, ExpenseWithSplitUsers } from "../model"
import { CircularProgress, Divider, IconButton, Stack, Typography, useTheme } from "@mui/material"
import dayjs from "dayjs"
import Comments from "./Comments"
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import FormattedAmount from "../components/FormattedAmount"
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import imageCompression from "browser-image-compression";
import { PhotoProvider, PhotoView } from "react-photo-view";
import 'react-photo-view/dist/react-photo-view.css';
import { PhotoRenderParams } from "react-photo-view/dist/types";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { NavBackButton, NavLeftToolBar, NavRightToolBar } from "../components/NavBar";
import { css } from "@emotion/css";


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

      <FileUploadZone>
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
      </FileUploadZone>
      <Divider />
      <Comments />
      <Outlet />
    </Stack >
  )
}

const FileUploadZone: React.FC<{
  children?: ReactNode;
}> = ({ children }) => {
  const [dragEnter, setDragEnter] = useState(false)
  const depthRef = useRef(0)
  return (
    <Stack
      component="div"
      sx={{ p: 1, opacity: dragEnter ? 0.2 : 1 }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragEnter(true)
        depthRef.current++
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depthRef.current--
        if (depthRef.current > 0) return;
        setDragEnter(false)
      }}
      onDragOver={(e) => {
        e.preventDefault();
        // e.dataTransfer.dropEffect = "copy"
        console.log("drag over")
        setDragEnter(true)
      }}
      onDrop={(e) => {
        e.preventDefault();
        for (const file of e.dataTransfer.files) {
          console.log(`detect file`, file);

        }
        e.dataTransfer.clearData();
        depthRef.current = 0
        setDragEnter(false)
      }}
    >
      {children}
    </Stack>
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
  const theme = useTheme()

  const queryClient = useQueryClient()
  const { mutateAsync } = useMutation({
    mutationFn: (id: string) => {
      return authFetch(`/api/expense/${expenseId}/attachment/${id}`, {
        method: "DELETE",
        handleResponse: (response) => response.json()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expense", expenseId, "photos"],
      })
    }
  })

  return (
    <PhotoProvider
      className={css`
      @supports (padding-top: env(safe-area-inset-top)) {
        .PhotoView-Slider__BannerWrap {
          padding-top: calc(${theme.spacing(1.5)} + env(safe-area-inset-top));
        }
      }`}

      toolbarRender={({ images, index }) => {
        return (
          <DeleteIcon color="error" onClick={async () => {
            try {
              const yes = window.confirm("delete?")
              console.debug(`confirm`,)
              if (!yes) return;

              const id = images[index].originRef?.current?.dataset["photoid"];
              if (id) {
                await mutateAsync(id)
              }
            } catch (err) {
              console.error(err)
            }

          }} />
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
    <PhotoView src={data} key={photo.id}>
      <img
        key={photo.id}
        data-photoid={photo.id}
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
      return await authFetch(`/api/expense/${expenseId}/attachment`, {
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
          formData.append('image', compressedFile, file.name)
        }
        await mutateAsync(formData)
      }
      e.target.value = ''; // cleanup
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: "error" })
    }
  }

  useEffect(() => {
    console.debug(`register clipboard event`)
    const listenPaste = async (e: ClipboardEvent) => {
      console.debug(`detect paste event`, e)
      e.preventDefault();
      const clipboardItems = typeof navigator?.clipboard?.read === 'function'
        ? await navigator.clipboard.read()
        : e.clipboardData?.files;

      for (const clipboardItem of clipboardItems ?? []) {
        let blob;
        if (clipboardItem instanceof (File) && clipboardItem.type?.startsWith('image/')) {
          // For files from `e.clipboardData.files`.
          blob = clipboardItem
          // Do something with the blob.
          console.log(`detect image from clipboard(File)`, blob)
        } else if (clipboardItem instanceof (ClipboardItem)) {
          // For files from `navigator.clipboard.read()`.
          const imageTypes = clipboardItem.types?.filter(type => type.startsWith('image/'))
          for (const imageType of imageTypes) {
            blob = await clipboardItem.getType(imageType);
            // Do something with the blob.
            console.log(`detect image from clipboard(ClipboardItem)`, blob)
          }
        }
      }
    }
    document.addEventListener("paste", listenPaste);
    return () => {
      console.debug(`unregister clipboard event`)
      document.removeEventListener("paste", listenPaste);
    }
  }, [])

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
