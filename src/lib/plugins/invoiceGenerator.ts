import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  dueDate: string;
  currency: string;
  items: InvoiceItem[];
  taxPercent: number;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
}

export const invoiceGeneratorPlugin: HymliPlugin = {
  id: 'invoice-generator',
  name: 'Invoice & Billing Generator',
  category: 'finance',
  description: 'Generates itemized client billing statements with subtotal and tax breakdowns.',
  icon: 'FileText',
  execute: async (data: InvoiceData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated invoice #${data.invoiceNumber} for ${data.clientName}.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(invoiceGeneratorPlugin);
