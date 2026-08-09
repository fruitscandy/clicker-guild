export class DomainValidationError extends RangeError {
  readonly field: string;

  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = "DomainValidationError";
    this.field = field;
  }
}

export function assertFiniteIntegerInRange(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new DomainValidationError(field, "유한한 정수여야 합니다.");
  }

  if (value < minimum || value > maximum) {
    throw new DomainValidationError(field, `${minimum} 이상 ${maximum} 이하여야 합니다.`);
  }
}

export function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DomainValidationError(field, "비어 있지 않은 문자열이어야 합니다.");
  }
}

export function assertPlainObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DomainValidationError(field, "객체여야 합니다.");
  }
}
