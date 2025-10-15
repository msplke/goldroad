/**
 * Shared constants that can be safely used in both client and server code
 */

/** Maximum number of benefits allowed per plan */
export const MAX_BENEFITS_PER_PLAN = 4;

export const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**The amount being taken by the business as a percentage of the total transaction
 * when a payment is made to a subaccount*/
export const SUBACCOUNT_PERCENTAGE_CHARGE = 5; // i.e. subaccount gets 95% of the transaction
