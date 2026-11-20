import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    Stack
} from '@mui/material';
import {
    CheckCircle as ApprovedIcon,
    Schedule as PendingIcon,
    Error as ErrorIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const NotificationCard = ({ notification, onAction }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'approved':
                return <ApprovedIcon sx={{ fontSize: 32, color: '#4CAF50' }} />;
            case 'pending':
                return <PendingIcon sx={{ fontSize: 32, color: '#FF9800' }} />;
            case 'rejected':
                return <ErrorIcon sx={{ fontSize: 32, color: '#d32f2f' }} />;
            default:
                return <InfoIcon sx={{ fontSize: 32, color: '#1976D2' }} />;
        }
    };

    const getStatusChip = (status) => {
        const statusMap = {
            approved: { label: 'Aprobado', color: 'success' },
            pending: { label: 'Pendiente', color: 'warning' },
            rejected: { label: 'Rechazado', color: 'error' },
            info: { label: 'Información', color: 'info' }
        };
        const config = statusMap[status] || statusMap.info;
        return <Chip label={config.label} color={config.color} variant="outlined" />;
    };

    return (
        <Card sx={{
            mb: 2,
            border: '1px solid #e0e0e0',
            transition: 'all 0.3s ease',
            '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
            }
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ pt: 0.5 }}>
                        {getIcon(notification.status)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            mb: 1
                        }}>
                            <Box>
                                <Typography variant="h6" sx={{
                                    fontWeight: 'bold',
                                    color: '#000',
                                    mb: 0.5
                                }}>
                                    {notification.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                    {notification.description}
                                </Typography>
                            </Box>
                            {getStatusChip(notification.status)}
                        </Box>
                        <Typography variant="caption" sx={{ color: '#999' }}>
                            {new Date(notification.date).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Typography>
                        {notification.actions && (
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                {notification.actions.map((action, idx) => (
                                    <Button
                                        key={idx}
                                        size="small"
                                        variant={action.primary ? 'contained' : 'outlined'}
                                        onClick={() => onAction(notification.id, action.type)}
                                        sx={{
                                            backgroundColor: action.primary ? '#1976D2' : 'transparent',
                                            color: action.primary ? '#fff' : '#1976D2'
                                        }}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default NotificationCard;
