import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CURRENCIES, getCurrencyByCode } from "@/lib/currencies";

interface CurrencyComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function CurrencyCombobox({
  value,
  onValueChange,
  className,
  placeholder = "Select currency...",
}: CurrencyComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCurrency = getCurrencyByCode(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full h-12 justify-between bg-background border-border text-foreground font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {selectedCurrency
            ? `${selectedCurrency.code} — ${selectedCurrency.name}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 z-[200]" 
        align="start"
      >
        <Command>
          <CommandInput 
            placeholder="Search currencies..." 
            className="h-10"
          />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code} ${currency.name}`}
                  onSelect={() => {
                    onValueChange(currency.code);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{currency.code}</span>
                  <span className="ml-2 text-muted-foreground">
                    {currency.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
