import { Visibility, VisibilityOff } from '@mui/icons-material';
import { TextField, InputAdornment, IconButton, type TextFieldProps } from '@mui/material';
import React, { useState } from 'react';

type PasswordTextareaProps = Omit<
  TextFieldProps,
  'type' | 'InputProps' | 'multiline' | 'rows' // Keep these omitted as we add them back below
> & {
  minRows?: number;
  maxRows?: number;
};

const PasswordTextarea = ({
  minRows = 4,
  maxRows,
  label,
  placeholder,
  value,
  onChange,
  required,
  className, // Keep className prop for potential non-sx styling
  sx, // Allow sx prop for styling
  ...rest // Pass through any other TextFieldProps
}: PasswordTextareaProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent focus loss on click
  };

  // Completely restructured styling to fix padding and border radius issues
  const defaultSx = {
    width: '100%',
    marginBottom: '16px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #767676',

    // Remove any extra spacing
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
    },

    // Main input container styling
    '& .MuiInputBase-root': {
      borderRadius: '16px',
      backgroundColor: '#2C2C2C',
      color: '#fff',
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: 400,
      padding: '0px',
    },

    // The actual textarea styling
    '& .MuiInputBase-input': {
      padding: '20px',
      resize: 'none',
      fontSize: '16px',
      fontFamily: 'Inter',
      fontWeight: 400,
      color: '#fff',
      WebkitTextSecurity: showPassword ? 'none' : 'disc',
      '&::placeholder': {
        color: '#767676',
        opacity: 1,
      },
    },

    // Remove default outlined border
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },

    // Icon styling
    '& .MuiInputAdornment-root': {
      margin: '0',
      height: 'auto',
      position: 'absolute',
      right: '20px',
      top: '15px',
    },

    '& .MuiIconButton-root': {
      color: '#fff',
      padding: '8px',
    },
  };

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={className}
      sx={{ ...defaultSx, ...sx }}
      fullWidth
      multiline
      minRows={minRows}
      maxRows={maxRows}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  );
};

export default PasswordTextarea;
