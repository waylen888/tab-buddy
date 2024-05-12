import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { authFetch } from "../hooks/api";
import { Comment } from "../model";
import { Box, Divider, IconButton, Paper, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { LoadingButton } from "@mui/lab";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import { DRAWER_WIDTH } from "../components/NavBar";
import Linkify from "linkify-react";
import { useAuth } from "../components/AuthProvider";
import DeleteIcon from '@mui/icons-material/Delete';


const Comments = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ["expense", expenseId, "comments"],
    queryFn: ({ signal }) => {
      return authFetch<Comment[]>(`/api/expense/${expenseId}/comments`, { signal })
    },
  });
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (commentId: string) => {
      return authFetch(`/api/expense/${expenseId}/comment/${commentId}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expense", expenseId, "comments"],
      })
    },
  })
  const handleDelete = (commentId: string) => async () => {
    try {
      await mutateAsync(commentId)
    } catch (err) {

    }
  }

  return (
    <Stack sx={{ p: 1 }} gap={2}>
      <Typography variant="h4">Comments</Typography>
      {
        data?.map((comment) => {
          return (
            <Paper key={comment.id} sx={{ p: 1 }} elevation={1}>
              <Stack gap={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" sx={{ color: "primary.main" }}>
                    {comment.displayName}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={handleDelete(comment.id)}
                    sx={{
                      display: me.id === comment.createBy ? undefined : "none",
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>


                <Typography
                  sx={{
                    display: "flex",
                    wordBreak: "break-all",
                    whiteSpace: "pre-wrap",
                  }}>
                  <Linkify>
                    {comment.content}
                  </Linkify>
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}
                >
                  <Stack direction="row" alignItems="center" gap={1}>
                    <span>Create at</span>
                    <span>{dayjs(comment.createAt).format("YYYY/MM/DD HH:mm:ss")}</span>
                  </Stack>
                </Typography>
              </Stack>

            </Paper>
          )
        })
      }
      <CommentPostForm />
      <Box sx={{ height: "120px" }} />
    </Stack>
  )
}

export default Comments;


interface CommentPostFormValues {
  content: string
}
const CommentPostForm = () => {
  const { expenseId } = useParams<{ expenseId: string }>()
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: CommentPostFormValues) => {
      return authFetch(`/api/expense/${expenseId}/comment`, {
        method: "POST",
        body: JSON.stringify({
          expenseId: expenseId,
          content: values.content,
        })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expense", expenseId, "comments"]
      });
    }
  })
  const { enqueueSnackbar } = useSnackbar()
  const methods = useForm<CommentPostFormValues>()
  const onSubmit = async (values: CommentPostFormValues) => {
    try {
      const content = values.content.trim();
      if (!!content) {
        await mutateAsync({ content: content });
      }
      methods.reset({
        content: "",
      });
    } catch (err) {
      enqueueSnackbar((err as Error).message, { variant: "error" })
    }
  }
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      <Stack sx={{
        flexDirection: "row",
        width: `calc(100% - ${fullScreen ? DRAWER_WIDTH : '0px'})`,
        position: "fixed",
        bottom: 0,
        left: 0,
        gap: 2,
        p: 2,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        backgroundColor: (theme) => theme.palette.background.paper,
        marginLeft: fullScreen ? DRAWER_WIDTH : 0,
      }} >
        <Controller
          control={methods.control}
          name="content"
          rules={{ required: true }}
          render={({ field }) => (
            <TextField {...field}
              placeholder="Comment"
              fullWidth
              multiline
              maxRows={3}
            />
          )}
        />
        <LoadingButton
          type="submit"
          disabled={isPending || !methods.formState.isValid}
          loading={isPending}
        >
          Send
        </LoadingButton>
      </Stack>
    </form>
  )
}