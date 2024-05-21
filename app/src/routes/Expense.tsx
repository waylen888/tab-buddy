import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useAuthFetch } from "../hooks/api"
import { ExpenseAttachment, ExpenseWithSplitUsers } from "../model"
import { CircularProgress, Divider, IconButton, Stack, Typography, useTheme } from "@mui/material"
import dayjs from "dayjs"
import Comments from "./Comments"
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import FormattedAmount from "../components/FormattedAmount"
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import imageCompression from "browser-image-compression";
import { PhotoProvider, PhotoView } from "react-photo-view";
import 'react-photo-view/dist/react-photo-view.css';
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

        <Attachments />

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
  const { expenseId } = useParams<{ expenseId: string }>();

  if (!expenseId) throw Error("expenseId is required")

  const [dragEnter, setDragEnter] = useState(false)
  const depthRef = useRef(0)
  const { mutateAsync, isPending } = useUploadAttachment(expenseId)
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
      onDrop={async (e) => {
        e.preventDefault();

        if (isPending) return

        try {
          await mutateAsync(e.dataTransfer.files)
        } catch (error) {
          console.error(error)
        } finally {
          e.dataTransfer.clearData();
          depthRef.current = 0
          setDragEnter(false)
        }
      }}
    >
      {children}
    </Stack>
  )
}



const Attachments: React.FC<{}> = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const authFetch = useAuthFetch()
  const { data } = useQuery({
    queryKey: ["expense", expenseId, "attachments"],
    queryFn: () => {
      return authFetch<ExpenseAttachment[]>(`/api/expense/${expenseId}/attachments`)
    }
  })
  const theme = useTheme()
  return (
    <Stack gap={2}>
      <PhotoProvider
        className={css`
      @supports (padding-top: env(safe-area-inset-top)) {
        .PhotoView-Slider__BannerWrap {
          padding-top: calc(${theme.spacing(1.5)} + env(safe-area-inset-top));
        }
      }`}

        toolbarRender={({ images, index }) => {
          const id = images[index]?.originRef?.current?.dataset["photoid"];
          if (id) {
            return <AttachmentDeleteButton id={id} />
          }
          return null
        }}>

        <Stack direction="row" gap={2} sx={{
          overflowY: "auto",
        }}>
          {
            data?.filter(attachment => attachment.mime.startsWith("image"))
              .map((attachment) => (<Photo key={attachment.id} photo={attachment} />))
          }
        </Stack>
      </PhotoProvider>

      <Stack gap={1}>
        {
          data?.filter(attachment => !attachment.mime.startsWith("image"))
            .map((attachment) => (
              <Stack key={attachment.id} direction="row" justifyContent="space-between" alignItems="center">
                <a
                  target="_blank"
                  href={`/static/photo/${attachment.id}`}
                >
                  {attachment.filename}
                </a>
                <AttachmentDeleteButton id={attachment.id} />
              </Stack>
            ))
        }
      </Stack>
    </Stack>
  )
}

const Photo: React.FC<{
  photo: ExpenseAttachment
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

const AttachmentDeleteButton: React.FC<{
  id: string;
}> = ({ id }) => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const authFetch = useAuthFetch()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const { mutateAsync } = useMutation({
    mutationFn: (id: string) => {
      return authFetch(`/api/expense/${expenseId}/attachment/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      enqueueSnackbar("刪除成功", { variant: "success" })
      queryClient.invalidateQueries({
        queryKey: ["expense", expenseId, "attachments"],
      })
    }
  })
  return (
    <IconButton
      size="small"
      onClick={async () => {
        try {
          const yes = window.confirm("delete?")
          console.debug(`confirm`,)
          if (!yes) return;
          await mutateAsync(id)
        } catch (err) {
          console.error(err)
        }
      }}
    >
      <DeleteIcon color="error" />
    </IconButton>
  )
}

const useUploadAttachment = (expenseId: string) => {
  const authFetch = useAuthFetch()
  const queryClient = useQueryClient()
  const { mutateAsync, mutate, ...rest } = useMutation({
    mutationFn: async (formData: FormData) => {
      return await authFetch(`/api/expense/${expenseId}/attachment`, {
        method: "POST",
        body: formData
      })
    }, onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['expense', expenseId, 'attachments'],
      })
    },
  })
  const acceptType = (type: string | undefined) => {
    return type?.startsWith('image/') || type?.startsWith('text/') || type?.startsWith('application/pdf')
  }
  const uploadFiles = async (files: FileList) => {
    const formData = new FormData()
    for (const file of files) {
      if (!acceptType(file.type)) {
        console.debug(`not acceptable type`, file)
        continue
      }
      if (file.type.startsWith("image")) {
        // handle image types
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: "image/webp",
        });
        formData.append("image", compressedFile, file.name)
      } else {
        // handle the others
        formData.append("file", file, file.name)
      }
    }
    return mutateAsync(formData)
  }
  return { mutateAsync: uploadFiles, ...rest }
}


async function clipboardItemsToFileList(clipboardItems: ClipboardItems | FileList) {
  if (clipboardItems instanceof (FileList)) {
    return clipboardItems
  }

  const files = [];
  for (const item of clipboardItems) {
    for (const type of item.types) {
      const blob = await item.getType(type);
      files.push(new File([blob], `clipboard-file-${Date.now()}`, { type: blob.type }));
    }
  }

  // Helper function to create a FileList from an array of files
  function createFileList(files: File[]) {
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  return createFileList(files);
}

const ImageUploadButton = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const { enqueueSnackbar } = useSnackbar()

  if (!expenseId) throw Error("expenseId is required")

  const { mutateAsync, isPending } = useUploadAttachment(expenseId);
  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (files) {
        await mutateAsync(files)
      }
      e.target.value = ''; // cleanup
      enqueueSnackbar("上傳完成", { variant: "success" })
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: "error" })
    }
  }



  useEffect(() => {
    console.debug(`register clipboard event`)
    const listenPaste = async (e: ClipboardEvent) => {
      console.debug(`detect paste event`, e)
      e.preventDefault();
      // const clipboardItems = typeof navigator?.clipboard?.read === 'function'
      //   ? await navigator.clipboard.read()
      //   : e.clipboardData?.files;
      const clipboardItems = e.clipboardData?.files;

      if (clipboardItems) {
        clipboardItemsToFileList(clipboardItems).then((files) => {
          return mutateAsync(files)
        })
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
      <IconButton component="label" disabled={isPending}>
        <AttachFileIcon />
        <input
          type="file"
          accept="image/*,text/*,application/pdf"
          id="file-select-input"
          hidden
          multiple
          onChange={handleSelectFile}
        />
      </IconButton>
    </>
  )
}
