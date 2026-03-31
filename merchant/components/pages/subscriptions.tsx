"use client"

import { subscriptions } from "@/lib/mock-data"
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

export function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <p className="text-sm text-muted-foreground">
          Recurring billing schedules and their current status.
        </p>
      </div>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processor</TableHead>
              <TableHead>Next Billing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.customer}</TableCell>
                <TableCell className="text-right tabular-nums">
                  ${sub.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColor[sub.status]}
                  >
                    {sub.status.charAt(0).toUpperCase() +
                      sub.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs uppercase tracking-wide text-muted-foreground">
                  {sub.processor}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(sub.nextBillingDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
