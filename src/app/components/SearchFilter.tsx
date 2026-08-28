import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, X } from 'lucide-react';

interface SearchFilterProps {
  onSearchChange: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onWeekFilter: (value: string) => void;
  showWeekFilter?: boolean;
  showStatusFilter?: boolean;
}

export function SearchFilter({
  onSearchChange,
  onStatusFilter,
  onWeekFilter,
  showWeekFilter = true,
  showStatusFilter = true,
}: SearchFilterProps) {
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('all');
  const [weekValue, setWeekValue] = useState('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusValue(value);
    onStatusFilter(value);
  };

  const handleWeekChange = (value: string) => {
    setWeekValue(value);
    onWeekFilter(value);
  };

  const handleClearFilters = () => {
    setSearchValue('');
    setStatusValue('all');
    setWeekValue('all');
    onSearchChange('');
    onStatusFilter('all');
    onWeekFilter('all');
  };

  const hasActiveFilters = searchValue !== '' || statusValue !== 'all' || weekValue !== 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search reports, students..."
          value={searchValue}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      {showStatusFilter && (
        <Select value={statusValue} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Week Filter */}
      {showWeekFilter && (
        <Select value={weekValue} onValueChange={handleWeekChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Week" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weeks</SelectItem>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(week => (
              <SelectItem key={week} value={week.toString()}>
                Week {week}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  );
}
