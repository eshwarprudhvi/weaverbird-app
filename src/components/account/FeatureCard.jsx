import React from 'react';
import { ChevronRight } from 'lucide-react';
import Card from '../common/Card/Card';

const FeatureCard = ({ icon: Icon, title, status, badge, onClick, iconColor = "var(--text-main)" }) => {
  return (
    <Card 
      onClick={onClick} 
      style={{ 
        padding: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
        <div style={{
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${iconColor}`,
          backgroundColor: 'transparent'
        }}>
          {Icon && <Icon size={20} color={iconColor} />}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ 
              fontWeight: 600, 
              color: 'var(--text-title)',
              fontSize: '15px'
            }}>
              {title}
            </span>
            {badge && (
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'var(--accent-gold)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '12px',
                textTransform: 'uppercase'
              }}>
                {badge}
              </span>
            )}
          </div>
          
          <div style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            whiteSpace: 'pre-line' // Allows passing newlines for multi-line status
          }}>
            {status}
          </div>
        </div>
      </div>
      
      <div style={{ color: 'var(--text-muted)', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
        <ChevronRight size={18} />
      </div>
    </Card>
  );
};

export default FeatureCard;
