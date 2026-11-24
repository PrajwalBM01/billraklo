export type LineFields = {
  description: string;
  hsn: string;
  taxable: string;
  ratePct: string;
};

export type InvoiceFields = {
  id?: string;
  supplierName: string;
  supplierGstin: string;
  buyerGstin: string;
  invoiceNo: string;
  invoiceDate: string;
  taxablePaise: string;
  cgstPaise: string;
  sgstPaise: string;
  igstPaise: string;
  totalPaise: string;
  lines: LineFields[];
};

export const emptyInvoice: InvoiceFields = {
  supplierName: "",
  supplierGstin: "",
  buyerGstin: "",
  invoiceNo: "",
  invoiceDate: "",
  taxablePaise: "",
  cgstPaise: "",
  sgstPaise: "",
  igstPaise: "",
  totalPaise: "",
  lines: [],
};

export const emptyLine: LineFields = { description: "", hsn: "", taxable: "", ratePct: "" };

export const manualUploadMaxBytes = 10 * 1024 * 1024;
export const manualUploadAccept = "application/pdf,image/jpeg,image/png,image/webp";
