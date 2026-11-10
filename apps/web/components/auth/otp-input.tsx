"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const OTP_LENGTH = 6;

export function OtpInput({
  id,
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={OTP_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus
      containerClassName="justify-center"
      aria-invalid={invalid || undefined}
    >
      <InputOTPGroup>
        {Array.from({ length: OTP_LENGTH }, (_, i) => (
          <InputOTPSlot key={i} index={i} aria-invalid={invalid || undefined} className="size-11 text-base" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
