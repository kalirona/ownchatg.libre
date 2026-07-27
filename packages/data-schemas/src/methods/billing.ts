import type { FilterQuery } from 'mongoose';
import type * as t from '~/types';

export function createBillingMethods(
  mongoose: typeof import('mongoose'),
  deps?: {
    updateBalance?: (args: {
      user: string;
      incrementValue: number;
      setValues?: Record<string, unknown>;
    }) => Promise<{ tokenCredits: number }>;
  },
) {
  const SubscriptionPlan = mongoose.models.SubscriptionPlan as import('mongoose').Model<t.ISubscriptionPlan>;
  const CreditPack = mongoose.models.CreditPack as import('mongoose').Model<t.ICreditPack>;
  const UserSubscription = mongoose.models.UserSubscription as import('mongoose').Model<t.IUserSubscription>;
  const PaymentTransaction = mongoose.models.PaymentTransaction as import('mongoose').Model<t.IPaymentTransaction>;
  const WebhookEvent = mongoose.models.WebhookEvent as import('mongoose').Model<t.IWebhookEvent>;

  return {
    /* Subscription Plans */
    async getActivePlans(): Promise<t.ISubscriptionPlan[]> {
      return SubscriptionPlan.find({ active: true }).lean();
    },

    async getPlanById(id: string): Promise<t.ISubscriptionPlan | null> {
      return SubscriptionPlan.findById(id).lean();
    },

    /* Credit Packs */
    async getActiveCreditPacks(): Promise<t.ICreditPack[]> {
      return CreditPack.find({ active: true }).lean();
    },

    async getCreditPackById(id: string): Promise<t.ICreditPack | null> {
      return CreditPack.findById(id).lean();
    },

    /* Token Credits */
    async addTokenCredits(userId: string, credits: number): Promise<void> {
      if (!deps?.updateBalance) {
        const Balance = mongoose.models.Balance as import('mongoose').Model<{ user: string; tokenCredits: number }>;
        await Balance.findOneAndUpdate(
          { user: userId },
          { $inc: { tokenCredits: credits } },
          { upsert: true, new: true },
        ).lean();
        return;
      }
      await deps.updateBalance({ user: userId, incrementValue: credits });
    },

    /* User Subscriptions */
    async getUserSubscription(userId: string): Promise<t.IUserSubscription | null> {
      return UserSubscription.findOne({ user: userId, status: 'active' }).lean();
    },

    async getUserSubscriptions(userId: string): Promise<t.IUserSubscription[]> {
      return UserSubscription.find({ user: userId }).sort({ createdAt: -1 }).lean();
    },

    async getUserSubscriptionByProviderId(providerSubscriptionId: string): Promise<t.IUserSubscription | null> {
      return UserSubscription.findOne({ providerSubscriptionId }).lean();
    },

    async getSubscriptionById(id: string): Promise<t.IUserSubscription | null> {
      return UserSubscription.findById(id).lean();
    },

    async createUserSubscription(data: {
      user: string;
      planName: string;
      provider: 'lemon_squeezy' | 'paypal';
      providerSubscriptionId?: string;
      providerCustomerId?: string;
      status?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
    }): Promise<t.IUserSubscription> {
      return UserSubscription.create(data);
    },

    async updateUserSubscription(
      filter: FilterQuery<t.IUserSubscription>,
      update: Partial<t.IUserSubscription>,
    ): Promise<t.IUserSubscription | null> {
      return UserSubscription.findOneAndUpdate(filter, { $set: update }, { new: true }).lean();
    },

    async cancelUserSubscription(subscriptionId: string): Promise<t.IUserSubscription | null> {
      return UserSubscription.findByIdAndUpdate(
        subscriptionId,
        { $set: { status: 'canceled', canceledAt: new Date() } },
        { new: true },
      ).lean();
    },

    /* Payment Transactions */
    async getPaymentTransactions(
      userId: string,
      limit = 20,
      skip = 0,
    ): Promise<t.IPaymentTransaction[]> {
      return PaymentTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    },

    async getPaymentTransactionByProviderId(providerTransactionId: string): Promise<t.IPaymentTransaction | null> {
      return PaymentTransaction.findOne({ providerTransactionId }).lean();
    },

    async createPaymentTransaction(data: {
      user: string;
      type: 'subscription' | 'credit_pack';
      provider: 'lemon_squeezy' | 'paypal';
      providerTransactionId?: string;
      providerSubscriptionId?: string;
      amount: number;
      currency?: string;
      creditsAwarded: number;
      status?: string;
      metadata?: Record<string, unknown>;
    }): Promise<t.IPaymentTransaction> {
      return PaymentTransaction.create({
        ...data,
        currency: data.currency || 'USD',
        status: data.status || 'completed',
      });
    },

    /* Webhook Events (idempotency) */
    async findWebhookEvent(eventId: string): Promise<t.IWebhookEvent | null> {
      return WebhookEvent.findOne({ eventId }).lean();
    },

    async createWebhookEvent(data: {
      provider: 'lemon_squeezy' | 'paypal';
      eventId: string;
      eventType: string;
      rawBody?: unknown;
    }): Promise<t.IWebhookEvent> {
      return WebhookEvent.create(data);
    },

    async markWebhookProcessed(
      eventId: string,
      errorMessage?: string,
    ): Promise<t.IWebhookEvent | null> {
      const update: Partial<t.IWebhookEvent> = {
        status: errorMessage ? 'failed' : 'processed',
        processedAt: new Date(),
      };
      if (errorMessage) {
        update.errorMessage = errorMessage;
      }
      return WebhookEvent.findOneAndUpdate({ eventId }, { $set: update }, { new: true }).lean();
    },
  };
}

export type BillingMethods = ReturnType<typeof createBillingMethods>;
