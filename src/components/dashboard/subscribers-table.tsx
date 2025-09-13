"use client";

import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

type Subscriber = {
  id: string;
  email: string;
  firstName: string | null;
  status: string;
  nextPaymentDate: Date | null;
  totalRevenue: number;
  createdAt: Date;
  planName: string;
  planAmount: number;
  planInterval: string;
  publicationName: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "default";
    case "non-renewing":
      return "secondary";
    case "attention":
      return "destructive";
    case "completed":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusDisplayName(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "non-renewing":
      return "Non-renewing";
    case "attention":
      return "Attention";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

interface SubscribersTableProps {
  subscribers: Subscriber[];
}

export function SubscribersTable({ subscribers }: SubscribersTableProps) {
  if (subscribers.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No subscribers found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subscriber</TableHead>
            <TableHead>Publication</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Next Payment</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((subscriber) => (
            <TableRow key={subscriber.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {subscriber.firstName || "N/A"}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {subscriber.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {subscriber.publicationName}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{subscriber.planName}</div>
                  <div className="text-muted-foreground text-sm">
                    {formatCurrency(subscriber.planAmount)}/
                    {subscriber.planInterval}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(subscriber.status)}>
                  {getStatusDisplayName(subscriber.status)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(subscriber.totalRevenue)}
              </TableCell>
              <TableCell>
                {subscriber.nextPaymentDate
                  ? formatDate(subscriber.nextPaymentDate)
                  : "N/A"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(subscriber.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SubscribersTableWithData() {
  const {
    data: subscribers,
    isLoading,
    error,
  } = api.subscriber.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border bg-card p-8">
        <div className="text-center">
          <p className="text-destructive">
            Error loading subscribers: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return <SubscribersTable subscribers={subscribers || []} />;
}
