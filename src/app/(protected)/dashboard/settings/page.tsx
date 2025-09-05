"use client";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your account settings, ConvertKit integration, and bank
          details.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold text-lg">Personal Details</h3>
          <div className="text-muted-foreground">
            Update your name, email, and profile information.
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold text-lg">ConvertKit Integration</h3>
          <div className="text-muted-foreground">
            Manage your ConvertKit API key and integration settings.
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-4 font-semibold text-lg">Bank Details</h3>
          <div className="text-muted-foreground">
            Update your bank account information for payouts.
          </div>
        </div>
      </div>
    </div>
  );
}
