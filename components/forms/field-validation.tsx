"use client";

import { useId, useState, type SyntheticEvent } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement;

export function FieldError({ id, message }: { id: string; message?: string }) {
  return <span id={id} className="field-error" aria-live="polite">{message}</span>;
}

export function useFieldValidation() {
  const formId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function setError(name: string, message: string) {
    setErrors((current) => ({ ...current, [name]: message }));
  }

  function field(name: string, message: string, check?: (input: Field) => string) {
    function validate(input: Field) {
      input.setCustomValidity(check?.(input) ?? "");
      return input.validity.valid ? "" : input.validity.customError ? input.validationMessage : message;
    }

    return {
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": `${formId}-${name}`,
      onBlur(event: SyntheticEvent<Field>) {
        setTouched((current) => ({ ...current, [name]: true }));
        const error = validate(event.currentTarget);
        if (error) setError(name, error);
      },
      onInput(event: SyntheticEvent<Field>) {
        const error = validate(event.currentTarget);
        if (touched[name] || errors[name]) setError(name, error);
      },
      onInvalid(event: SyntheticEvent<Field>) {
        event.preventDefault();
        const input = event.currentTarget;
        setError(name, validate(input));
        if (input.form?.querySelector(":invalid") === input) input.focus();
      },
    };
  }

  function error(name: string) {
    return <FieldError id={`${formId}-${name}`} message={errors[name]} />;
  }

  return { field, error, setError };
}
