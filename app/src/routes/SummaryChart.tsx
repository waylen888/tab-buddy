import { useState } from "react";
import { Backdrop, Box, IconButton, Modal, useTheme } from "@mui/material";
import { PieChart } from '@mui/x-charts/PieChart';
import { GroupExpense } from "../model";
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

import { getCategory } from "../components/CategoryIcon";
import { DefaultizedPieValueType, pieArcLabelClasses } from '@mui/x-charts';

import AutoSizer from "react-virtualized-auto-sizer";


export const SummaryButton = ({ expenses }: { expenses: GroupExpense[]; }) => {
  const [open, setOpen] = useState<boolean>(false)
  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <LeaderboardIcon />
      </IconButton>
      <SummaryChart
        open={open}
        onClose={() => setOpen(false)}
        expenses={expenses}
      />
    </>
  )
}

function SummaryChart({ open, onClose, expenses }: {
  open: boolean
  onClose: () => void
  expenses: GroupExpense[];
}) {
  const summary = expenses?.reduce((summary, expense) => {
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

  const getArcLabel = (params: DefaultizedPieValueType) => {
    const percent = params.value / summary.total;
    return `${(percent * 100).toFixed(0)}%`;
  };

  const theme = useTheme()

  if (!summary) {
    return null
  }

  return (
    <Backdrop

      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={open}
      onClick={onClose}


    >
      <Box sx={{
        height: "100%",
        width: "100%",
        p: 4,
      }}>
        <AutoSizer>
          {({ height, width }) => {
            return (
              <PieChart
                series={[
                  {
                    data: summary?.expenses,
                    arcLabel: getArcLabel,
                    outerRadius: 150,
                    cx: width / 2,
                  },
                ]}
                width={width}
                height={height}
                sx={{
                  [`& .${pieArcLabelClasses.root}`]: {
                    fill: 'white',
                    fontSize: 14,
                  },

                }}
                slotProps={{
                  legend: {
                    // hidden: true
                    position: {
                      vertical: "bottom",
                      horizontal: "middle",
                    },

                  }
                }}
                margin={{ right: 100 }}
              />
            )
          }}
        </AutoSizer>

      </Box>

    </Backdrop>
  )
}
