"use client"

import * as React from "react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  className,
  disabled = false,
  minDate,
  maxDate
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="date"
        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
        onChange={handleDateChange}
        disabled={disabled}
        min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
        max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
        className="w-full"
      />
      {selectedDate && (
        <div className="text-sm text-muted-foreground">
          {format(selectedDate, 'EEEE, MMMM do, yyyy')}
        </div>
      )}
    </div>
  )
}
