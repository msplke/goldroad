// import { BankDetailsForm } from "~/components/dashboard/settings/bank-details-form";
import { KitSettingsForm } from "~/components/dashboard/settings/kit-settings-form";
import { PersonalDetailsForm } from "~/components/dashboard/settings/personal-details-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, integrations, and payment details.
        </p>
      </div>

      <div className="grid gap-6">
        <PersonalDetailsForm />
        <KitSettingsForm />
        {/* <BankDetailsForm /> */}
      </div>
    </div>
  );
}
