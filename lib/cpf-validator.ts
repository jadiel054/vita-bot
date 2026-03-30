/**
 * CPF Validation Module
 * Implements the official Brazilian CPF validation algorithm
 */

/**
 * Validate CPF using the official algorithm with check digits
 * @param cpf - CPF string (with or without formatting)
 * @returns true if valid, false otherwise
 */
export function isValidCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const digits = cpf.replace(/\D/g, "");

  // CPF must have exactly 11 digits
  if (digits.length !== 11) {
    return false;
  }

  // Reject CPFs with all identical digits (e.g., 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(digits[9])) {
    return false;
  }

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(digits[10])) {
    return false;
  }

  return true;
}

/**
 * Get a human-readable error message for invalid CPF
 */
export function getCPFErrorMessage(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length === 0) {
    return "CPF não pode estar vazio";
  }

  if (digits.length < 11) {
    return `CPF incompleto. Faltam ${11 - digits.length} dígitos`;
  }

  if (digits.length > 11) {
    return "CPF possui mais de 11 dígitos";
  }

  if (/^(\d)\1{10}$/.test(digits)) {
    return "CPF inválido: todos os dígitos são iguais";
  }

  return "CPF inválido ou incorreto: dígitos verificadores não conferem";
}
