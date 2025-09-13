"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { SubscriberListItem } from "~/server/api/routers/subscriber";

export const columns: ColumnDef<SubscriberListItem>[] = [
  {
    accessorKey: "subscriber.firstName",
    header: "First Name",
  },
  {
    accessorKey: "subscriber.email",
    header: "Email",
  },
  {
    accessorKey: "publication.name",
    header: "Publication",
  },
  {
    accessorKey: "plan.interval",
    header: "Plan Interval",
    cell: ({ getValue }) => {
      const interval = getValue() as string;
      if (interval === "annually") return "Annual";
      return <span className="capitalize">{interval}</span>;
    },
  },
  {
    accessorKey: "subscriber.status",
    header: "Subscription status",
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return <span className="capitalize">{status}</span>;
    },
  },
  {
    accessorKey: "subscriber.createdAt",
    header: "Subscribed On",
    cell: ({ getValue }) => {
      const date = getValue() as Date;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    accessorKey: "subscriber.nextPaymentDate",
    header: "Next Payment Date",
    cell: ({ getValue }) => {
      const date = getValue() as Date | null;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
  {
    accessorKey: "plan.amount",
    header: "Plan Amount (Ksh)",
    cell: ({ getValue }) => {
      const amount = getValue() as number;
      return amount.toLocaleString("en-KE", {
        style: "currency",
        currency: "KES",
      });
    },
  },
  {
    accessorKey: "subscriber.totalRevenue",
    header: "Total Revenue (Ksh)",
    cell: ({ getValue }) => {
      const totalRevenue = getValue() as number;
      return totalRevenue.toLocaleString("en-KE", {
        style: "currency",
        currency: "KES",
      });
    },
  },
];
