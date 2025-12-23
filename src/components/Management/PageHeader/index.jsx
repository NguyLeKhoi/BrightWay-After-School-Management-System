import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import styles from './ManagementPageHeader.module.css';

/**
 * Shared management page header for admin/manager roles.
 */
const ManagementPageHeader = ({
  title,
  icon,
  createButtonText = 'Thêm mới',
  onCreateClick,
  children
}) => (
  <motion.div 
    className={styles.header}
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className={styles.titleWrapper}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <h1 className={styles.title}>{title}</h1>
    </div>
    <div className={styles.actions}>
      {onCreateClick && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateClick}
            className={styles.addButton}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 600,
              background: 'var(--color-secondary)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
              '&:hover': {
                background: 'var(--color-secondary-dark)',
                boxShadow: 'var(--shadow-md)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {createButtonText}
          </Button>
        </motion.div>
      )}
      {children}
    </div>
  </motion.div>
);

export default ManagementPageHeader;

