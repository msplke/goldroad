"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

type OneTimePayment = {
  id: string | null;
  publicationName: string;
  email: string | null;
  createdAt: Date | null;
  publicationId: string | null;
  paystackPaymentReference: string | null;
  firstName: string | null;
  lastName: string | null;
  amount: number | null;
  channel:
    | "card"
    | "bank"
    | "apple_pay"
    | "ussd"
    | "qr"
    | "mobile_money"
    | "bank_transfer"
    | "eft"
    | "payattitude"
    | null;
};

function formatCurrency(amount: number | null): string {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
}

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

interface OneTimePaymentsTableProps {
  info: OneTimePayment[];
}

export function OneTimePaymentsTable({ info }: OneTimePaymentsTableProps) {
  if (info.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No one-time payments found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supporter</TableHead>
            <TableHead>Publication</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid at</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {info.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {payment.firstName && payment.lastName
                      ? `${payment.firstName} ${payment.lastName}`
                      : "N/A"}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {payment.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {payment.publicationName}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                {payment.createdAt ? formatDate(payment.createdAt) : "N/A"}
              </TableCell>
              <TableCell className="capitalize">{payment.channel}</TableCell>
              <TableCell>{payment.paystackPaymentReference}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function OneTimePaymentsTableWithData() {
  const {
    data: payments,
    isLoading,
    error,
  } = api.oneTimePayments.getRecent.useQuery({});

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading one-time payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border bg-card p-8">
        <div className="text-center">
          <p className="text-destructive">
            Error loading one-time payments: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return <OneTimePaymentsTable info={payments || []} />;
}
