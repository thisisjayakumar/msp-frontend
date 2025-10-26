"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SearchableDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Search and select...",
  displayKey = "display_name",
  valueKey = "id",
  searchKeys = ["display_name"],
  disabled = false,
  error = false,
  className = "",
  loading = false,
  allowClear = true,
  maxHeight = "200px"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
      return;
    }

    const filtered = options.filter(option => {
      return searchKeys.some(key => {
        const value = option[key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });

    setFilteredOptions(filtered);
  }, [searchTerm, options, searchKeys]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // Only clear search if nothing is selected
        if (!value) {
          setSearchTerm("");
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Get selected option display text
  const getSelectedDisplay = () => {
    if (!value) return "";
    const selectedOption = options.find(option => option[valueKey] === value);
    return selectedOption ? selectedOption[displayKey] : "";
  };

  const handleOptionSelect = (option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // If user is typing and there's a selected value, clear it to allow new search
    if (value && newValue !== getSelectedDisplay()) {
      onChange("");
    }
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // If there's a selected value, select all text for easy replacement
    if (value && inputRef.current && !searchTerm) {
      setTimeout(() => {
        inputRef.current?.select();
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    // Handle backspace/delete when there's a selected value
    if ((e.key === 'Backspace' || e.key === 'Delete') && value && !searchTerm) {
      onChange("");
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || getSelectedDisplay()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={`
            w-full px-3 py-2 text-sm rounded-lg border transition-all pr-16 text-slate-800
            ${error 
              ? 'border-red-300 bg-red-50' 
              : isOpen 
                ? 'border-blue-500 bg-white ring-1 ring-blue-500' 
                : 'border-slate-300 bg-white hover:border-slate-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
            placeholder:text-slate-400
          `}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {loading && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          )}
          {allowClear && value && !disabled && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              type="button"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDownIcon 
            className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg">

          {/* Options list */}
          <div 
            className="max-h-60 overflow-y-auto"
            style={{ maxHeight }}
          >
            {loading ? (
              <div className="p-3 text-center text-slate-500 text-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Loading options...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-sm">
                {searchTerm ? 'No matching options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option[valueKey] || index}
                  onClick={() => handleOptionSelect(option)}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0
                    ${option[valueKey] === value 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'hover:bg-slate-50 text-slate-700'
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{option[displayKey]}</span>
                    {/* Show additional info if available */}
                    {option.description && (
                      <span className="text-xs text-slate-500 mt-0.5">{option.description}</span>
                    )}
                    {option.product_code && option.product_code !== option[displayKey] && (
                      <span className="text-xs text-slate-400 mt-0.5">Code: {option.product_code}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
