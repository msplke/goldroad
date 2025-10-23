import type { ListBanksQueryParams } from "~/server/fetch-clients/paystack/routes/misc";
import type { CreatePaymentPageInput } from "~/server/fetch-clients/paystack/schemas/payment-page";
import type { SubaccountCreationInfo } from "~/server/fetch-clients/paystack/schemas/subaccount";
import type { TransactionSplitCreationInfo } from "~/server/fetch-clients/paystack/schemas/transaction-split";

/** This defines the Paystack API endpoints that will be used by the application.
 * Each method corresponds to a specific API call to Paystack.
 * How the calls will be made will be defined by implementers of this interface.
 */
export interface PaystackApiService<FetchClient> {
  /** The fetch client used to make API calls.
   * Ensure that the the secret key is included in the headers of the client */
  $fetch: FetchClient;
  /** Endpoints for managing payment pages */
  paymentPage: PaymentPageEndpoints;
  /** Endpoints for managing transaction splits */
  split: TransactionSplitEndpoints;
  /** Endpoints for managing subaccounts */
  subaccount: SubaccountEndpoints;
  /** Miscellaneous endpoints for various supporting APIs */
  miscellaneous: MiscellaneousEndpoints;
}

export interface PaymentPageEndpoints {
  /** Create a new payment page on Paystack */
  create: (
    input: CreatePaymentPageInput,
  ) => Promise<{ id: number; slug: string }>;
}

export interface TransactionSplitEndpoints {
  /** Create a new split on Paystack and return  */
  create: (
    input: TransactionSplitCreationInfo,
  ) => Promise<{ splitCode: string }>;
}

export interface SubaccountEndpoints {
  /** Create a new subaccount on Paystack */
  create: (
    input: SubaccountCreationInfo,
  ) => Promise<{ subaccountCode: string }>;
}

/** The Miscellaneous API are supporting APIs that can be used to provide more details to other APIs */
export interface MiscellaneousEndpoints {
  /** Get a list of supported banks and their properties */
  listBanks: (
    query: ListBanksQueryParams,
  ) => Promise<Array<{ id: number; name: string; code: string }>>;
}
