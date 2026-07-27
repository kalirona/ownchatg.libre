import { Model } from 'mongoose';
import type * as t from '~/types';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import paymentTransactionSchema from '~/schema/paymentTransaction';

export function createPaymentTransactionModel(mongoose: typeof import('mongoose')): Model<t.IPaymentTransaction> {
  applyTenantIsolation(paymentTransactionSchema);
  return mongoose.models.PaymentTransaction || mongoose.model<t.IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema);
}
