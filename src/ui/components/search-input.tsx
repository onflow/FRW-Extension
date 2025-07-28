import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { Input, InputAdornment, IconButton } from '@mui/material';
import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  sx?: object;
  showClearButton?: boolean;
  onClear?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search',
  autoFocus = true,
  sx = {},
  showClearButton = true,
  onClear,
}) => {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        minHeight: '46px',
        zIndex: '999',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        boxSizing: 'border-box',
        border: 'none',
        color: '#FFFFFF',
        width: '100%',
        '& input': {
          padding: '8px 16px',
          '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.6)',
            opacity: 1,
          },
          '&::-webkit-search-cancel-button': {
            display: 'none',
          },
          '&::-webkit-search-decoration': {
            display: 'none',
          },
          '&::-webkit-search-results-button': {
            display: 'none',
          },
          '&::-webkit-search-results-decoration': {
            display: 'none',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
        },
        ...sx,
      }}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disableUnderline
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon sx={{ ml: '10px', my: '5px', color: 'rgba(255, 255, 255, 0.6)' }} />
        </InputAdornment>
      }
      endAdornment={
        showClearButton &&
        value && (
          <InputAdornment position="end">
            <IconButton
              onClick={handleClear}
              sx={{
                width: '20px',
                height: '20px',
                borderRadius: '20px',
                marginRight: '4px',
                backgroundColor: '#FFFFFF0F',
                cursor: 'pointer',
              }}
            >
              <CloseIcon
                sx={{
                  color: 'icon.navi',
                  cursor: 'pointer',
                  width: '14px',
                  height: '14px',
                }}
              />
            </IconButton>
          </InputAdornment>
        )
      }
    />
  );
};

export default SearchInput;
