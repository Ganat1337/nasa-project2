import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ElementType,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { forwardRef } from "react";

type GlassCardProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function GlassCard<T extends ElementType = "section">({
  as,
  className,
  ...props
}: GlassCardProps<T>) {
  const Element = as ?? "section";
  return <Element className={`ui-glass-card ${className ?? ""}`} {...props} />;
}

type GlassSheetProps = HTMLAttributes<HTMLDivElement>;

export const GlassSheet = forwardRef<HTMLDivElement, GlassSheetProps>(function GlassSheet(
  { className, ...props },
  ref,
) {
  return <div className={`ui-glass-sheet ${className ?? ""}`} ref={ref} {...props} />;
});

interface CapsuleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function CapsuleButton({
  className,
  type = "button",
  variant = "secondary",
  ...props
}: CapsuleButtonProps) {
  return (
    <button
      className={`ui-capsule ui-capsule--${variant} ${className ?? ""}`}
      type={type}
      {...props}
    />
  );
}

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps extends HTMLAttributes<HTMLDivElement> {
  "aria-label": string;
  options: readonly SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
}

export function SegmentedControl({
  "aria-label": ariaLabel,
  className,
  onValueChange,
  options,
  value,
  ...props
}: SegmentedControlProps) {
  const activeIndex = options.findIndex((option) => option.value === value);
  return (
    <div
      aria-label={ariaLabel}
      className={`ui-segmented ${className ?? ""}`}
      role="group"
      {...props}
    >
      <span
        className="ui-segmented__thumb"
        style={{ transform: `translateX(${Math.max(0, activeIndex) * 100}%)` }}
        aria-hidden="true"
      />
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className="ui-segmented__option"
          key={option.value}
          onClick={() => onValueChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "aria-checked" | "aria-label"
> {
  checked: boolean;
  label: string;
}

export function Switch({ checked, className, label, ...props }: SwitchProps) {
  return (
    <label className={`ui-switch ${className ?? ""}`}>
      <span className="ui-switch__label">{label}</span>
      <span className="ui-switch__control">
        <input
          aria-checked={checked}
          checked={checked}
          role="switch"
          type="checkbox"
          {...props}
        />
        <span className="ui-switch__track" aria-hidden="true" />
      </span>
    </label>
  );
}

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  level: "nominal" | "info" | "caution" | "warning" | "emergency";
  icon?: ReactNode;
}

export function StatusPill({
  children,
  className,
  icon,
  level,
  ...props
}: StatusPillProps) {
  return (
    <span className={`ui-status-pill ui-status-pill--${level} ${className ?? ""}`} {...props}>
      <span className="ui-status-pill__icon" aria-hidden="true">
        {icon}
      </span>
      {children}
    </span>
  );
}

interface KpiNumberProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function KpiNumber({ className, ...props }: KpiNumberProps) {
  return <div className={`ui-kpi-number ${className ?? ""}`} {...props} />;
}

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  kicker: string;
  title: ReactNode;
  aside?: ReactNode;
}

export function SectionHeader({ aside, className, kicker, title, ...props }: SectionHeaderProps) {
  return (
    <div className={`ui-section-header ${className ?? ""}`} {...props}>
      <div>
        <p className="ui-section-header__kicker">{kicker}</p>
        <h2 className="ui-section-header__title">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export function Hairline({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={`ui-hairline ${className ?? ""}`} aria-hidden="true" {...props} />;
}

type TimelineProps = HTMLAttributes<HTMLOListElement>;

export function Timeline({ className, ...props }: TimelineProps) {
  return <ol className={`ui-timeline ${className ?? ""}`} {...props} />;
}
