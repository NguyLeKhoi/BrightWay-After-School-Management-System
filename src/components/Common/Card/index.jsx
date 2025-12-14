import React from 'react';
import { IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import styles from './Card.module.css';

const Card = ({ 
  title, 
  subtitle,
  description,
  image,
  avatar,
  status,
  badges,
  infoRows,
  actions,
  className = '',
  onClick,
  onDelete,
  children 
}) => {
  const CardComponent = onClick ? 'button' : 'div';
  
  return (
    <CardComponent 
      className={`${styles.card} ${className}`}
      onClick={onClick}
      style={{ position: 'relative' }}
    >
      {onDelete && (
        <IconButton
          className={styles.deleteIcon}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              backgroundColor: 'var(--color-error-light, #ffebee)',
              color: 'var(--color-error, #d32f2f)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
      {image && (
        <div className={styles.cardImage}>
          {image}
        </div>
      )}
      
      {avatar && (
        <div className={styles.cardAvatar}>
          {typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('/')) ? (
            <img src={`${avatar}${avatar.includes('?') ? '&' : '?'}cb=${Date.now()}`}
                 alt={title || 'Avatar'}
                 className={styles.avatarImage} />
          ) : (
            <span>{avatar}</span>
          )}
        </div>
      )}
      
      <div className={styles.cardContent}>
        {title && (
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{title}</h3>
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          </div>
        )}
        
        {description && (
          <p className={styles.cardDescription}>{description}</p>
        )}
        
        {infoRows && (
          <div className={styles.cardInfo}>
            {infoRows.map((row, index) => (
              <div key={index} className={styles.infoRow}>
                <span className={styles.infoLabel}>{row.label}</span>
                <span className={styles.infoValue}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {badges && (
          <div className={styles.cardBadges}>
            {badges.map((badge, index) => (
              <span 
                key={index} 
                className={`${styles.badge} ${styles[badge.type] || ''}`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}
        
        {status && (
          <div className={styles.cardStatus}>
            <span className={`${styles.statusBadge} ${styles[status.type]}`}>
              {status.text}
            </span>
          </div>
        )}
        
        {children}
      </div>
      
      {actions && (
        <div className={styles.cardActions}>
          {actions.map((action, index) => (
            <button 
              key={index}
              className={`${styles.actionButton} ${
                action.danger 
                  ? styles.dangerButton 
                  : action.primary 
                    ? styles.primaryButton 
                    : styles.secondaryButton
              }`}
              onClick={action.onClick}
            >
              {action.icon}
              {action.text}
            </button>
          ))}
        </div>
      )}
    </CardComponent>
  );
};

export default Card;

