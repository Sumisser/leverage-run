import { format, subMonths, subYears, startOfYear, isSameDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function DatePickerWithRange({
  date,
  setDate,
  minDate,
  maxDate,
  className,
}: DatePickerWithRangeProps) {
  const presets = [
    { label: "1个月", getValue: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
    { label: "3个月", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { label: "1年", getValue: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
    { label: "5年", getValue: () => ({ from: subYears(new Date(), 5), to: new Date() }) },
    { label: "10年", getValue: () => ({ from: subYears(new Date(), 10), to: new Date() }) },
    { label: "今年以来 (YTD)", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
    { label: "全部 (ALL)", getValue: () => ({ from: minDate || subYears(new Date(), 10), to: maxDate || new Date() }) },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            data-empty={!date}
            className={cn(
              "w-[260px] justify-start text-left font-normal border-slate-200 bg-white h-9 rounded-lg transition-all hover:bg-slate-50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
            {date?.from ? (
              date.to ? (
                <span className="text-[10px] font-bold text-slate-600">
                  {format(date.from, "yyyy/MM/dd")} — {format(date.to, "yyyy/MM/dd")}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600">{format(date.from, "yyyy/MM/dd")}</span>
              )
            ) : (
              <span className="text-[10px] font-bold text-slate-400">选择回测区间</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-row rounded-3xl overflow-hidden border-slate-200 shadow-2xl bg-white z-[100]" align="start">
          <div className="flex flex-col border-r border-slate-100 p-2 bg-slate-50 min-w-[120px]">
            <span className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              快速选择
            </span>
            {presets.map((p) => {
              const presetRange = p.getValue();
              const isActive = date?.from && date?.to && 
                isSameDay(date.from, presetRange.from!) && 
                isSameDay(date.to, presetRange.to!);
                
              return (
                <Button
                  key={p.label}
                  variant="ghost"
                  className={cn(
                    "justify-start text-[11px] font-bold h-8 px-3 rounded-xl transition-all",
                    isActive 
                      ? "bg-primary/20 text-primary shadow-sm" 
                      : "hover:bg-primary/10 hover:text-primary text-slate-600"
                  )}
                  onClick={() => setDate(presetRange)}
                >
                  {p.label}
                </Button>
              )
            })}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            fromDate={minDate}
            toDate={maxDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
