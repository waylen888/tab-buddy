import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Backdrop, Box, Dialog, DialogContent, DialogTitle, IconButton, Modal, Stack, useTheme } from "@mui/material";

import { GroupExpense } from "../model";
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

import { getCategory } from "../components/CategoryIcon";


import AutoSizer from "react-virtualized-auto-sizer";
import { Chart } from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "../hooks/api";
import { format } from "../components/FormattedAmount";

export const SummaryButton = ({ groupId }: { groupId: string; }) => {
  const [open, setOpen] = useState<boolean>(false)
  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <LeaderboardIcon />
      </IconButton>
      <SummaryChart
        open={open}
        onClose={() => { setOpen(false) }}
        groupId={groupId}
      />
    </>
  )
}

function SummaryChart({ open, onClose, groupId }: {
  open: boolean
  onClose: () => void
  groupId: string;
}) {

  const { data } = useQuery({
    queryKey: ["group", groupId, "expenses", "to_twd", true],
    queryFn: () => authFetch<GroupExpense[]>(`/api/group/${groupId}/expenses?to_twd=true`),
    enabled: open,
  })

  const summary = data?.reduce((summary, expense) => {
    const sum = summary.expenses.find(sum => sum.id === expense.category)
    if (sum === undefined) {
      summary.expenses.push({
        id: expense.category,
        value: Number(expense.amount),
        label: getCategory(expense.category).name,
      })
    } else {
      sum.value += Number(expense.amount)
    }
    summary.total += Number(expense.amount)
    return summary
  }, {
    expenses: [] as {
      id: string;
      value: number
      label: string
    }[],
    total: 0,
  })
  summary?.expenses.sort((a, b) => b.value - a.value)
  // const getArcLabel = (params: DefaultizedPieValueType) => {
  //   const percent = params.value / summary.total;
  //   return `${(percent * 100).toFixed(0)}%`;
  // };
  const getLabel = (value: number) => {
    const percent = value / summary.total;
    return `${(percent * 100).toFixed(0)}%`;
  };


  const chartRef = useRef<Chart>(null)
  const setRef = useCallback((ref: HTMLCanvasElement) => {
    if (!open || !ref) {
      return
    }

    console.debug(data)
    chartRef.current?.destroy()
    chartRef.current = new Chart(
      ref.getContext("2d"),
      {
        type: 'pie',
        data: {
          labels: summary?.expenses
            .map(expense => `${expense.label} ${format(expense.value, "TWD")} ${getLabel(expense.value)}`),

          datasets: [
            {
              data: summary?.expenses.map(expense => expense.value)
            }
          ],
        },

        options: {
          plugins: {
            legend: {
              position: "bottom",
              labels: {

              },
            },
            datalabels: {
              formatter: (value: number, context: any) => {
                return getLabel(value)
              },
              display: (context: any) => {
                return context.dataset.data[context.dataIndex] > 0
              },
              color: "white",
            }
          },
        },
        plugins: [
          ChartDataLabels,
        ]
      }
    );
  }, [open, data])

  return (
    <Dialog
      sx={{
        color: '#fff',
        backgroundColor: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 100,
      }}
      open={open}
      fullScreen
    >
      <DialogTitle>
        Group Expense Summary
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers
        sx={{ height: "100%" }}
      >
        <Box sx={{
          height: "100%",
          width: "100%",
        }}>
          <AutoSizer>
            {({ height, width }) => {
              return (
                <div style={{ width, height }}>

                  <canvas id="group-expense-summary-chart" ref={setRef}>

                  </canvas>
                </div>
              )
            }}
          </AutoSizer>
        </Box>
      </DialogContent>

    </Dialog>
  )
}
