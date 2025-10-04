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
        setSearchTerm("");
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus the search input when opening
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main trigger button */}
      <div
        onClick={toggleDropdown}
        className={`
          w-full px-4 py-3 rounded-xl border cursor-pointer transition-all
          ${error 
            ? 'border-red-300 bg-red-50' 
            : isOpen 
              ? 'border-blue-500 bg-white ring-2 ring-blue-500 ring-opacity-20' 
              : 'border-slate-300 bg-white hover:border-slate-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}
          flex items-center justify-between
        `}
      >
        <span className={`${!value ? 'text-slate-400' : 'text-slate-700'} truncate`}>
          {getSelectedDisplay() || placeholder}
        </span>
        
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
          {allowClear && value && !disabled && (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-1"
              type="button"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronDownIcon 
            className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-xl shadow-lg">
          {/* Search input */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-10 pr-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options list */}
          <div 
            className="max-h-60 overflow-y-auto"
            style={{ maxHeight }}
          >
            {loading ? (
              <div className="p-4 text-center text-slate-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Loading options...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                {searchTerm ? 'No matching options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option[valueKey] || index}
                  onClick={() => handleOptionSelect(option)}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0
                    ${option[valueKey] === value 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'hover:bg-slate-50 text-slate-700'
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{option[displayKey]}</span>
                    {/* Show additional info if available */}
                    {option.description && (
                      <span className="text-sm text-slate-500 mt-1">{option.description}</span>
                    )}
                    {option.product_code && option.product_code !== option[displayKey] && (
                      <span className="text-xs text-slate-400 mt-1">Code: {option.product_code}</span>
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
