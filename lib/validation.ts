// Comprehensive validation utilities for maritime data

export interface ValidationError {
  field: string
  message: string
}

export class ValidationException extends Error {
  errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    super("Validation failed")
    this.errors = errors
  }
}

// Ship validation
export function validateShip(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Gemi adı zorunludur" })
  }

  if (data.imo_number) {
    // IMO number should be 7 digits starting with "IMO"
    const imoPattern = /^IMO\d{7}$/
    if (!imoPattern.test(data.imo_number.replace(/\s/g, ""))) {
      errors.push({ field: "imo_number", message: "IMO numarası geçersiz (örn: IMO1234567)" })
    }
  }

  if (data.dwt && (isNaN(data.dwt) || data.dwt < 0)) {
    errors.push({ field: "dwt", message: "DWT pozitif bir sayı olmalıdır" })
  }

  if (data.built_year) {
    const currentYear = new Date().getFullYear()
    if (data.built_year < 1900 || data.built_year > currentYear) {
      errors.push({ field: "built_year", message: `İnşa yılı 1900 ile ${currentYear} arasında olmalıdır` })
    }
  }

  return errors
}

// Fixture validation
export function validateFixture(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.charterer || data.charterer.trim().length === 0) {
    errors.push({ field: "charterer", message: "Charterer zorunludur" })
  }

  // if (!data.cargo_type || data.cargo_type.trim().length === 0) {
  //   errors.push({ field: "cargo_type", message: "Kargo tipi zorunludur" })
  // }

  if (data.rate && (isNaN(data.rate) || data.rate < 0)) {
    errors.push({ field: "rate", message: "Navlun pozitif bir sayı olmalıdır" })
  }

  if (data.laycan_from && data.laycan_to) {
    const from = new Date(data.laycan_from)
    const to = new Date(data.laycan_to)
    if (from > to) {
      errors.push({ field: "laycan_to", message: "Laycan bitiş tarihi başlangıç tarihinden sonra olmalıdır" })
    }
  }

  if (!data.load_port) {
    errors.push({ field: "load_port", message: "Yükleme limanı zorunludur" })
  } else if (Array.isArray(data.load_port)) {
    if (data.load_port.length === 0) {
      errors.push({ field: "load_port", message: "En az bir yükleme limanı girilmelidir" })
    }
  } else if (typeof data.load_port === "string" && data.load_port.trim().length === 0) {
    errors.push({ field: "load_port", message: "Yükleme limanı zorunludur" })
  }

  if (!data.discharge_port) {
    errors.push({ field: "discharge_port", message: "Tahliye limanı zorunludur" })
  } else if (Array.isArray(data.discharge_port)) {
    if (data.discharge_port.length === 0) {
      errors.push({ field: "discharge_port", message: "En az bir tahliye limanı girilmelidir" })
    }
  } else if (typeof data.discharge_port === "string" && data.discharge_port.trim().length === 0) {
    errors.push({ field: "discharge_port", message: "Tahliye limanı zorunludur" })
  }

  return errors
}

// Invoice validation
export function validateInvoice(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  // Support both camelCase and snake_case
  const invoiceNumber = data.invoiceNumber || data.invoice_number
  const amount = data.amount
  const invoiceDate = data.invoiceDate || data.invoice_date
  const dueDate = data.dueDate || data.due_date
  const type = data.type

  if (!invoiceNumber || invoiceNumber.trim().length === 0) {
    errors.push({ field: "invoice_number", message: "Fatura numarası zorunludur" })
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    errors.push({ field: "amount", message: "Tutar pozitif bir sayı olmalıdır" })
  }

  if (!invoiceDate) {
    errors.push({ field: "invoice_date", message: "Fatura tarihi zorunludur" })
  }

  if (dueDate && invoiceDate) {
    const invoiceDateObj = new Date(invoiceDate)
    const dueDateObj = new Date(dueDate)
    if (dueDateObj < invoiceDateObj) {
      errors.push({ field: "due_date", message: "Vade tarihi fatura tarihinden önce olamaz" })
    }
  }

  if (!type || !["income", "expense"].includes(type)) {
    errors.push({ field: "type", message: "Fatura tipi gelir veya gider olmalıdır" })
  }

  return errors
}

// Voyage validation
export function validateVoyage(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.voyage_number || data.voyage_number.trim().length === 0) {
    errors.push({ field: "voyage_number", message: "Sefer numarası zorunludur" })
  }

  // Validate date sequences
  const dateFields = [
    { field: "eta_load", label: "ETA Yükleme" },
    { field: "etb_load", label: "ETB Yükleme" },
    { field: "etc_load", label: "ETC Yükleme" },
    { field: "etd_load", label: "ETD Yükleme" },
    { field: "eta_discharge", label: "ETA Tahliye" },
    { field: "etb_discharge", label: "ETB Tahliye" },
    { field: "etc_discharge", label: "ETC Tahliye" },
    { field: "etd_discharge", label: "ETD Tahliye" },
  ]

  // Check if dates are in logical order
  if (data.etb_load && data.eta_load && new Date(data.etb_load) < new Date(data.eta_load)) {
    errors.push({ field: "etb_load", message: "ETB yükleme ETA'dan önce olamaz" })
  }

  if (data.etc_load && data.etb_load && new Date(data.etc_load) < new Date(data.etb_load)) {
    errors.push({ field: "etc_load", message: "ETC yükleme ETB'den önce olamaz" })
  }

  if (data.etd_load && data.etc_load && new Date(data.etd_load) < new Date(data.etc_load)) {
    errors.push({ field: "etd_load", message: "ETD yükleme ETC'den önce olamaz" })
  }

  if (data.eta_discharge && data.etd_load && new Date(data.eta_discharge) < new Date(data.etd_load)) {
    errors.push({ field: "eta_discharge", message: "ETA tahliye ETD yüklemeden önce olamaz" })
  }

  return errors
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

// Phone validation
export function validatePhone(phone: string): boolean {
  const phonePattern = /^[\d\s\-+$$$$]+$/
  return phonePattern.test(phone) && phone.replace(/\D/g, "").length >= 10
}

// Generic required field validation
export function validateRequired(data: any, fields: string[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === "string" && data[field].trim().length === 0)) {
      errors.push({ field, message: `${field} zorunludur` })
    }
  }
  return errors
}
