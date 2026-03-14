import Stripe from 'stripe'

export const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY)!
)

export const STRIPE_PRICE_MONTHLY = (process.env.STRIPE_PRICE_MONTHLY_PROD || process.env.STRIPE_PRICE_MONTHLY)!
export const STRIPE_PRICE_YEARLY = (process.env.STRIPE_PRICE_YEARLY_PROD || process.env.STRIPE_PRICE_YEARLY)!
