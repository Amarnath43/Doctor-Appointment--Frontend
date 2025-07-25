
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const FilterSection = ({
  presets,
  preset,
  startDate,
  endDate,
  status,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onStatusChange,
}) => {
  const statusOptions = ['Completed', 'Pending', 'Cancelled'];

  const handleStatusChange = (statusValue, checked) => {
    if (checked) {
      onStatusChange([...status, statusValue]);
    } else {
      onStatusChange(status.filter(s => s !== statusValue));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 bg-muted/50 rounded-lg">
      <div>
        <Label className="text-sm font-medium mb-3 block">Date Range Presets</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {presets.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPresetChange(p.value)}
              className="text-xs sm:text-sm"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
            Start Date
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">
            End Date
          </Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Status Filter</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {statusOptions.map((statusOption) => (
            <div key={statusOption} className="flex items-center space-x-2">
              <Checkbox
                id={statusOption}
                checked={status.includes(statusOption)}
                onCheckedChange={(checked) => handleStatusChange(statusOption, checked)}
              />
              <Label 
                htmlFor={statusOption} 
                className="text-sm font-normal cursor-pointer"
              >
                {statusOption}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
