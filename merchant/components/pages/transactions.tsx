"use client"

import { transactions } from "@/lib/mock-data"
import { statusColor, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Transactions</h2>
        <p className="text-sm text-muted-foreground">
          Recent payment activity across all processors.
        </p>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Processor</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.customer}</TableCell>
                <TableCell className="text-right tabular-nums">
                  ${tx.amount.toFixed(2)}
                </TableCell>
                <TableCell className="capitalize">{tx.type}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColor[tx.state]}
                  >
                    {tx.state.charAt(0).toUpperCase() + tx.state.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs uppercase tracking-wide text-muted-foreground">
                  {tx.processor}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(tx.lastUpdated)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
