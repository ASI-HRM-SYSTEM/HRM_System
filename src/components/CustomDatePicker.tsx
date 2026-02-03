import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface CustomDatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

function CustomDatePicker({ value, onChange, placeholder = "Select date", className = "" }: CustomDatePickerProps) {
  // Convert string date (YYYY-MM-DD) to Date object
  const parseDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Convert Date object to string (YYYY-MM-DD)
  const formatDate = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleChange = (date: Date | null) => {
    onChange(formatDate(date));
  };

  return (
    <DatePicker
      selected={parseDate(value)}
      onChange={handleChange}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      className={`input-field w-full ${className}`}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      isClearable
      autoComplete="off"
      popperPlacement="bottom-start"
      portalId="date-picker-portal"
    />
  );
}

export default CustomDatePicker;
