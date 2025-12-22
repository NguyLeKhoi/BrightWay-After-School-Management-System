import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, Switch, Box, Typography, TextField, Checkbox, InputAdornment, IconButton, ListItemText } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ImageUpload from '../ImageUpload';
import styles from './Form.module.css';

// Password field component with show/hide toggle
const PasswordField = ({ name, control, placeholder, required, error, disabled, fieldProps, helperText }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field: controllerField, fieldState }) => (
        <TextField
          {...controllerField}
          type={showPassword ? 'text' : 'password'}
          id={name}
          name={name}
          variant="standard"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          error={!!fieldState.error || !!error}
          helperText={fieldState.error?.message || error || helperText}
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                  disabled={disabled}
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiInput-underline:before': {
              borderBottomColor: 'var(--color-primary)'
            },
            '& .MuiInput-underline:hover:before': {
              borderBottomColor: 'var(--color-primary-dark)'
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: 'var(--color-primary)'
            },
            '& .MuiInputBase-input': {
              color: 'var(--text-primary) !important'
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: 'var(--color-primary)'
            },
            '& .MuiFormHelperText-root': {
              color: 'rgba(255, 255, 255, 0.6)'
            },
            '& .MuiFormHelperText-root.Mui-error': {
              color: 'var(--color-error)'
            }
          }}
          {...fieldProps}
        />
      )}
    />
  );
};

const Form = forwardRef(({
  schema,
  defaultValues = {},
  onSubmit,
  onFieldChange,
  submitText = 'Submit',
  loading = false,
  fields = [],
  children,
  className = '',
  error = '',
  hideSubmitButton = false
}, ref) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    trigger,
    getValues,
    setValue,
    clearErrors
  } = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  });

  const previousErrorMessages = useRef({});

  // Watch all form values for changes
  const formValues = useWatch({
    control
  });

  // Call onFieldChange when form values change
  useEffect(() => {
    if (onFieldChange && formValues) {
      onFieldChange(formValues);
    }
  }, [formValues, onFieldChange]);

  // Reset form when defaultValues change (for update scenarios)
  // Use a ref to track previous defaultValues to avoid unnecessary resets
  const prevDefaultValuesRef = useRef(defaultValues);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      // Skip on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        prevDefaultValuesRef.current = defaultValues;
        return;
      }
      
      const prev = prevDefaultValuesRef.current || {};
      const current = defaultValues || {};
      
      // Check if only file fields (avatarFile, image) changed
      const nonFileKeys = Object.keys(current).filter(key => key !== 'avatarFile' && key !== 'image');
      const onlyFileFieldsChanged = nonFileKeys.every(key => {
        return prev[key] === current[key];
      }) && (
        (prev.avatarFile !== current.avatarFile) || 
        (prev.image !== current.image)
      );
      
      if (onlyFileFieldsChanged) {
        // Only update file fields without resetting the form
        if (current.avatarFile !== undefined) {
          setValue('avatarFile', current.avatarFile, { shouldValidate: false });
        }
        if (current.image !== undefined) {
          setValue('image', current.image, { shouldValidate: false });
        }
      } else {
        // Other fields changed, reset form
      reset(defaultValues, { keepDefaultValues: true });
      }
      
      prevDefaultValuesRef.current = defaultValues;
    }
  }, [defaultValues, reset]);

  useEffect(() => {
    const nextErrorMessages = {};
    Object.entries(errors).forEach(([fieldName, errorValue]) => {
      const message = errorValue?.message;
      if (message) {
        nextErrorMessages[fieldName] = message;
      }
    });
    previousErrorMessages.current = nextErrorMessages;
  }, [errors]);

  const formElementRef = useRef(null);

  const handleFormSubmit = async (data) => {
    try {
      // Note: Validation is already done in submit() function before calling this
      // Just call onSubmit callback
      const result = await onSubmit(data);
      previousErrorMessages.current = {};
      return result !== false; // Return true if result is not false
    } catch (error) {
      return false; // Return false on error
    }
  };

  // Expose submit function via ref
  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (formElementRef.current) {
        // First validate the form - trigger validation for all fields
        try {
          const isValid = await trigger();

          if (!isValid) {
            // Validation failed, don't submit
            return false;
          }

          // If validation passes, get values and submit
          const values = getValues();
          const result = await handleFormSubmit(values);

          // Return true only if submit was successful
          return result !== false;
        } catch (error) {
          return false;
        }
      }
      return false;
    },
    validate: async () => {
      return await trigger();
    },
    reset: (values, options) => {
      reset(values, options);
    },
    getValues: () => getValues(),
    setValue: (name, value, options) => {
      setValue(name, value, options);
    },
    clearErrors: (name) => {
      clearErrors(name);
    },
    control: control // Expose control for useWatch
  }));

  const renderField = (field) => {
    const {
      name,
      label,
      type = 'text',
      options = [],
      className = '',
      helperText,
      fullWidth,
      section, // Remove from fieldProps
      sectionDescription, // Remove from fieldProps
      gridSize, // Remove from fieldProps
      onChange: fieldOnChange, // Extract custom onChange handler
      ...fieldProps
    } = field;
    const error = errors[name];

    let inputElement;
    if (type === 'textarea') {
      inputElement = (
        <textarea
          {...register(name)}
          id={name}
          name={name}
          className={styles.formInput}
          placeholder={field.placeholder}
          required={field.required}
          rows={field.rows || 4}
          {...fieldProps}
        />
      );
    } else if (type === 'select') {
      inputElement = (
        <Controller
          name={name}
          control={control}
          render={({ field: controllerField }) => {
            const handleChange = (event, newValue) => {
              // Autocomplete onChange receives (event, newValue)
              // Ignore event, only use newValue
              // Handle both cases: newValue is an object with .value or newValue is the value itself
              let value = '';
              if (newValue) {
                if (typeof newValue === 'object' && newValue !== null && 'value' in newValue) {
                  // It's an option object { value, label }
                  value = newValue.value;
                } else if (typeof newValue === 'string' || typeof newValue === 'number') {
                  // It's already a primitive value
                  value = newValue;
                } else {
                  // Fallback: try to convert to string
                  value = String(newValue);
                }
              }
              // Ensure value is a string
              value = String(value || '');
              
              // Update react-hook-form field
              controllerField.onChange(value);
              
              // Call custom onChange handler if provided (pass only the value, not the event)
              if (fieldOnChange) {
                fieldOnChange(value);
              }
            };
            const selectedOption = options.find(
              (option) => {
                // Handle both string and number comparison
                const optionValue = String(option.value);
                const fieldValue = String(controllerField.value);
                return optionValue === fieldValue;
              }
            ) || null;
            return (
              <Autocomplete
                disableClearable={!field.allowClear}
                options={options || []}
                value={selectedOption}
                onChange={handleChange}
                getOptionLabel={(option) => {
                  if (!option || typeof option !== 'object') return '';
                  return option.label || '';
                }}
                filterOptions={(x) => x}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box component="li" {...optionProps} key={key} sx={{ py: 1.5 }}>
                      {option.description ? (
                        <ListItemText
                          primary={option.label}
                          secondary={option.description}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.75rem',
                            color: 'text.secondary'
                          }}
                        />
                      ) : (
                        <Typography variant="body2">{option.label}</Typography>
                      )}
                    </Box>
                  );
                }}
                renderInput={(params) => {
                  // Ưu tiên lỗi validation, sau đó helperText của field, cuối cùng là description của option đã chọn
                  const displayHelperText = error?.message || field.helperText || (selectedOption?.description || undefined);
                  return (
                    <TextField
                      {...params}
                      placeholder={field.placeholder}
                      size="small"
                      disabled={field.disabled}
                      error={!!error}
                      helperText={displayHelperText}
                      FormHelperTextProps={{
                        sx: {
                          marginTop: 0.5,
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  );
                }}
                isOptionEqualToValue={(option, value) => {
                  if (!option || !value) return false;
                  // Handle both string and number comparison
                  return String(option.value) === String(value.value);
                }}
                disabled={field.disabled}
                loading={field.loading}
                noOptionsText={options.length === 0 ? 'Không có dữ liệu' : 'Không tìm thấy'}
                openOnFocus
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: '8px'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-light)'
                  }
                }}
                {...fieldProps}
              />
            );
          }}
        />
      );
    } else if (type === 'multiselect') {
      const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
      const checkedIcon = <CheckBoxIcon fontSize="small" />;
      inputElement = (
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value } }) => {
            const normalizedValue = Array.isArray(value)
              ? value
              : value
              ? [value]
              : [];
            const selectedOptions = options.filter((option) =>
              normalizedValue.includes(option.value)
            );
            return (
              <Autocomplete
                multiple
                options={options}
                value={selectedOptions}
                onChange={(_, newValue) => onChange(newValue.map((option) => option.value))}
                getOptionLabel={(option) => option.label || ''}
                renderOption={(props, option, { selected }) => (
                  (() => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.label}
                      </li>
                    );
                  })()
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={field.placeholder || 'Chọn...'}
                    size="small"
                  />
                )}
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: '8px',
                    paddingY: '2px'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--border-light)'
                  }
                }}
                {...fieldProps}
                disableCloseOnSelect={true}
              />
            );
          }}
        />
      );
    } else if (type === 'checkbox') {
      inputElement = (
        <div className={styles.checkboxGroup}>
          <input
            {...register(name)}
            type="checkbox"
            id={name}
            name={name}
            className={styles.checkbox}
            {...fieldProps}
          />
          <label htmlFor={name} className={styles.checkboxLabel}>
            {label}
          </label>
        </div>
      );
    } else if (type === 'switch') {
      inputElement = (
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {label}:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: value ? 'success.main' : 'text.disabled',
                    fontWeight: 'medium'
                  }}
                >
                  {value ? 'Hoạt động' : 'Không hoạt động'}
                </Typography>
                <Switch
                  checked={value || false}
                  onChange={onChange}
                  color="primary"
                  sx={{
                    '& .MuiSwitch-thumb': {
                      backgroundColor: value ? 'var(--color-success)' : 'var(--bg-secondary)'
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: value ? 'var(--color-success-light)' : 'var(--border-light)'
                    }
                  }}
                  {...fieldProps}
                />
              </Box>
            </Box>
          )}
        />
      );
    } else if (type === 'password') {
      // Password field with show/hide toggle
      inputElement = (
        <PasswordField
          name={name}
          control={control}
          placeholder={field.placeholder}
          required={field.required}
          error={error}
          disabled={field.disabled}
          fieldProps={fieldProps}
        />
      );
    } else if (type === 'file') {
      inputElement = (
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange } }) => (
            <Box>
              <input
                type="file"
                accept={fieldProps.accept}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onChange(file);
                }}
                disabled={field.disabled}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                {...fieldProps}
              />
              {helperText && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {helperText}
                </Typography>
              )}
            </Box>
          )}
        />
      );
    } else if (type === 'imageupload') {
      inputElement = (
        <Controller
          name={name}
          control={control}
          render={({ field: { value, onChange }, fieldState }) => {
            // For edit mode, if value is a URL string and no file is selected, show the URL
            // If value is a File, show the file preview
            // If value is null/undefined, show empty
            const displayValue = value instanceof File ? value : (value || fieldProps.currentImageUrl || null);
            
            return (
              <ImageUpload
                value={displayValue}
                onChange={(file) => {
                  onChange(file);
                  // Call custom onChange handler if provided
                  if (fieldOnChange) {
                    fieldOnChange(file);
                  }
                }}
                label={label}
                helperText={helperText || fieldProps.helperText || 'Chọn file ảnh để tải lên (JPG, PNG, GIF). Kích thước tối đa 5MB.'}
                accept={fieldProps.accept || 'image/*'}
                maxSize={fieldProps.maxSize || 5 * 1024 * 1024} // 5MB default
                disabled={field.disabled}
                error={!!fieldState.error}
                required={field.required}
              />
            );
          }}
        />
      );
    } else if (type === 'date') {
      // Date field with proper value transformation
      inputElement = (
        <Controller
          name={name}
          control={control}
          defaultValue={null}
          render={({ field: controllerField, fieldState }) => {
            // Convert Date object or ISO string to YYYY-MM-DD format for input
            const formatDateForInput = (dateValue) => {
              if (!dateValue) return '';
              if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
                // ✅ Use local date components, NOT UTC (toISOString converts to UTC!)
                // This prevents timezone issues where selecting Dec 4 shows as Dec 3
                const year = dateValue.getFullYear();
                const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                const day = String(dateValue.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              }
              if (typeof dateValue === 'string') {
                // If it's an incomplete date string being typed by user, return as is
                if (dateValue.length < 10 && /^\d{0,4}-?\d{0,2}-?\d{0,2}$/.test(dateValue)) {
                  return dateValue;
                }
                // If it's an ISO string, extract date part
                if (dateValue.includes('T')) {
                  return dateValue.split('T')[0];
                }
                // If it's already YYYY-MM-DD, return as is
                return dateValue;
              }
              return '';
            };

            // Convert YYYY-MM-DD string to Date object or ISO string for form value
            const handleDateChange = (event) => {
              const inputValue = event.target.value;
              if (!inputValue) {
                controllerField.onChange(null);
                if (fieldOnChange) {
                  fieldOnChange(null);
                }
                return;
              }

              // Only parse if input is complete YYYY-MM-DD format (10 characters)
              if (inputValue.length !== 10) {
                // For incomplete input, store the string value temporarily
                // This allows user to continue typing without losing input
                controllerField.onChange(inputValue);
                if (fieldOnChange) {
                  fieldOnChange(inputValue);
                }
                return;
              }

              // Validate date format before parsing
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (!dateRegex.test(inputValue)) {
                controllerField.onChange(inputValue);
                if (fieldOnChange) {
                  fieldOnChange(inputValue);
                }
                return;
              }

              // Parse as local date to avoid timezone issues when calculating day of week
              // Format: YYYY-MM-DD
              const [year, month, day] = inputValue.split('-').map(Number);

              // Validate date components
              if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
                controllerField.onChange(inputValue);
                if (fieldOnChange) {
                  fieldOnChange(inputValue);
                }
                return;
              }

              const dateValue = new Date(year, month - 1, day); // Month is 0-indexed

              // Check if date is valid (e.g., not Feb 30th)
              if (dateValue.getFullYear() !== year ||
                  dateValue.getMonth() !== month - 1 ||
                  dateValue.getDate() !== day) {
                controllerField.onChange(inputValue);
                if (fieldOnChange) {
                  fieldOnChange(inputValue);
                }
                return;
              }

              controllerField.onChange(dateValue);
              if (fieldOnChange) {
                fieldOnChange(dateValue);
              }
            };

            return (
              <TextField
                type="date"
                id={name}
                name={name}
                value={formatDateForInput(controllerField.value)}
                onChange={handleDateChange}
                onBlur={controllerField.onBlur}
                variant="standard"
                placeholder={field.placeholder}
                required={field.required}
                disabled={field.disabled}
                error={!!fieldState.error}
                helperText={fieldState.error?.message || helperText}
                fullWidth
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  min: field.min || undefined,
                  max: field.max || undefined
                }}
                sx={{
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'var(--color-primary)'
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottomColor: 'var(--color-primary-dark)'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'var(--color-primary)'
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--text-primary) !important'
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'var(--color-primary)'
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.6)'
                  }
                }}
                {...fieldProps}
              />
            );
          }}
        />
      );
    } else {
      // Text, email, number, etc. - use TextField with standard variant
      inputElement = (
        <Controller
          name={name}
          control={control}
          defaultValue=""
          render={({ field: controllerField, fieldState }) => {
            // Smart date input mask for fields with date pattern
            const isDateField = field.pattern && /^\^\\d\{2\}\/\\d\{2\}\/\\d\{4\}\$$/.test(field.pattern);
            
            const handleDateChange = (e) => {
              if (isDateField) {
                // Apply smart date masking
                let value = e.target.value;
                // Remove non-numeric characters
                let cleaned = value.replace(/\D/g, '');

                let formatted = '';
                if (cleaned.length <= 2) {
                  formatted = cleaned;
                } else if (cleaned.length <= 4) {
                  formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                } else {
                  formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
                }

                // Update form field with formatted value
                controllerField.onChange(formatted);
                if (fieldOnChange) {
                  fieldOnChange(formatted);
                }
              } else {
                // Normal text input
                controllerField.onChange(e.target.value);
                if (fieldOnChange) {
                  fieldOnChange(e.target.value);
                }
              }
            };

            return (
              <TextField
                {...controllerField}
                type={type}
                id={name}
                name={name}
                variant="standard"
                placeholder={field.placeholder}
                required={field.required}
                disabled={field.disabled}
                error={!!fieldState.error}
                helperText={fieldState.error?.message || helperText}
                fullWidth
                onChange={handleDateChange}
                InputProps={isDateField ? {
                  // Remove calendar icon for date text fields
                  endAdornment: null
                } : undefined}
                sx={{
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'var(--color-primary)'
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottomColor: 'var(--color-primary-dark)'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'var(--color-primary)'
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--text-primary) !important'
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'var(--color-primary)'
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255, 255, 255, 0.6)'
                  }
                }}
                {...fieldProps}
              />
            );
          }}
        />
      );
    }

    const fieldContent = (
      <div className={styles.inputWrapper}>
        {inputElement}
        {/* Error messages are handled by TextField's helperText prop, so we don't need to display them separately */}
      </div>
    );

    return (
      <div className={`${styles.formGroup} ${fullWidth ? styles.fullWidth : ''} ${className ? styles[className] : ''}`}>
        <label htmlFor={name} className={styles.formLabel}>
          {label}
        </label>
        {fieldContent}
      </div>
    );
  };

  return (
    <form 
      ref={formElementRef}
      onSubmit={handleSubmit(handleFormSubmit)} 
      className={`${styles.form} ${className}`}
    >
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div className={styles.formFields}>
        <Grid container spacing={1.5}>
          {(() => {
            let currentSection = '';
            return fields.map((field, index) => {
              const elements = [];
              if (field.section && field.section !== currentSection) {
                currentSection = field.section;
                elements.push(
                  <Grid item xs={12} key={`section-${currentSection}-${index}`}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionTitle}>{field.section}</div>
        {field.sectionDescription && (
          <div className={styles.sectionDescription}>{field.sectionDescription}</div>
        )}
                    </div>
                  </Grid>
                );
              }

              elements.push(
                <Grid item xs={field.gridSize || 12} key={field.name || index}>
                  {renderField(field)}
                </Grid>
              );

              return (
                <React.Fragment key={`field-${field.name || index}`}>
                  {elements}
                </React.Fragment>
              );
            });
          })()}
        </Grid>
      </div>
      
      {children}
      
      {!hideSubmitButton && (
        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Loading...' : submitText}
          </button>
        </div>
      )}
    </form>
  );
});

Form.displayName = 'Form';

export default Form;
