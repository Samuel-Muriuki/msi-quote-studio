"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  group?: string;
  sublabel?: string;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  disabled,
  ariaLabel,
  className,
}: {
  value: string | null;
  onValueChange: (v: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  // Group options by their `group` field (preserves insertion order per group).
  const grouped = options.reduce<Record<string, SearchableOption[]>>((acc, opt) => {
    const key = opt.group ?? "";
    (acc[key] ??= []).push(opt);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            disabled={disabled}
            className={cn(
              "w-full justify-between gap-2 bg-surface-2 font-normal",
              !selected && "text-text-muted",
              className,
            )}
          />
        }
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-(--anchor-width) p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groupKeys.map((groupKey, idx) => {
              const items = grouped[groupKey] ?? [];
              return (
                <div key={groupKey || `group-${idx}`}>
                  <CommandGroup heading={groupKey || undefined}>
                    {items.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <CommandItem
                          key={opt.value}
                          value={`${opt.label} ${opt.sublabel ?? ""}`.trim()}
                          onSelect={() => {
                            onValueChange(opt.value);
                            setOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 size-3.5 shrink-0",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-text">
                              {opt.label}
                            </span>
                            {opt.sublabel && (
                              <span className="block truncate text-xs text-text-muted">
                                {opt.sublabel}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {idx < groupKeys.length - 1 && <CommandSeparator />}
                </div>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
