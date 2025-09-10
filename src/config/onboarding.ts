import { CreditCard, DollarSign, FileText, Mail } from "lucide-react";

interface StepField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "password" | "number" | "textarea" | "select";
}

interface StepContent {
  title: string;
  description: string;
  fields: StepField[];
  helpText?: string;
  helpLink?: string;
  requiresPrevious?: number[];
  selectOptions?: Record<string, { value: string; label: string }[]>;
}

interface StepConfig {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  content: StepContent;
}

export const stepConfigs: StepConfig[] = [
  {
    id: 1,
    icon: Mail,
    content: {
      title: "Set up Kit Integration",
      description:
        "Connect your Kit account to automatically sync paying subscribers.",
      fields: [
        {
          name: "apiKey",
          label: "Kit API Key",
          placeholder: "Your API key",
          type: "password",
        },
      ],
      helpText:
        "Your API key will be encrypted and stored securely. Get it from Account (top-right) → Settings → Developer (V4 Keys).",
      helpLink: "https://help.kit.com/en/articles/9902901-kit-api-overview",
    },
  },
  {
    id: 2,
    icon: CreditCard,
    content: {
      title: "Provide Bank Details",
      description:
        "We'll use these details to create a Paystack subaccount for your payouts.",
      fields: [
        {
          name: "bankCode",
          label: "Bank",
          placeholder: "Select your bank",
          type: "select",
        },
        {
          name: "accountNumber",
          label: "Account Number",
          placeholder: "1234567890",
          type: "text",
        },
        {
          name: "accountName",
          label: "Account Name",
          placeholder: "John Doe",
          type: "text",
        },
      ],
      helpText:
        "We'll create a Paystack subaccount using our main account and send payments directly to your bank.",
      selectOptions: {
        bankCode: [
          { value: "044", label: "Access Bank" },
          { value: "014", label: "Afribank" },
          { value: "023", label: "Citibank" },
          { value: "050", label: "Ecobank" },
          { value: "011", label: "First Bank" },
          { value: "214", label: "First City Monument Bank" },
          { value: "070", label: "Fidelity Bank" },
          { value: "058", label: "Guaranty Trust Bank" },
          { value: "030", label: "Heritage Bank" },
          { value: "082", label: "Keystone Bank" },
          { value: "076", label: "Polaris Bank" },
          { value: "221", label: "Stanbic IBTC Bank" },
          { value: "068", label: "Standard Chartered" },
          { value: "232", label: "Sterling Bank" },
          { value: "032", label: "Union Bank" },
          { value: "033", label: "United Bank for Africa" },
          { value: "215", label: "Unity Bank" },
          { value: "035", label: "Wema Bank" },
          { value: "057", label: "Zenith Bank" },
        ],
      },
    },
  },
  {
    id: 3,
    icon: FileText,
    content: {
      title: "Create Your Publication",
      description: "Set up your publication details that subscribers will see.",
      fields: [
        {
          name: "publicationName",
          label: "Publication Name",
          placeholder: "My Newsletter",
          type: "text",
        },
        {
          name: "publicationDescription",
          label: "Description",
          placeholder: "A weekly newsletter about...",
          type: "textarea",
        },
      ],
      helpText:
        "This information will be displayed on your public pricing page and payment forms.",
      requiresPrevious: [1, 2], // Requires Kit and Bank Details to be completed
    },
  },
  {
    id: 4,
    icon: DollarSign,
    content: {
      title: "Setup Payment Plans",
      description: "Configure your subscription pricing and benefits.",
      fields: [
        {
          name: "monthlyAmount",
          label: "Monthly Plan Amount (Ksh.)",
          placeholder: "5000",
          type: "number",
        },
        {
          name: "annualAmount",
          label: "Annual Plan Amount (Ksh.)",
          placeholder: "50000",
          type: "number",
        },
        {
          name: "benefits",
          label: "Subscriber Benefits",
          placeholder:
            "• Exclusive content\n• Early access\n• Community access",
          type: "textarea",
        },
      ],
      helpText:
        "Annual plans should offer savings compared to monthly. We'll create Paystack payment plans and generate your pricing page.",
      requiresPrevious: [1, 2, 3], // Requires all previous steps
    },
  },
];
