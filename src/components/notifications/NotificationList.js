import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Badge,
  Box,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  NotificationsNone as NotificationIcon,
  Check as CheckIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchNotifications,
  markAsRead,
  markAllAsRead
} from '../../redux/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

const NotificationList = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit }));
  }, [dispatch, page]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  if (loading && notifications.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <Typography variant="h6" component="div">
          Notifications
          {unreadCount > 0 && (
            <Badge
              badgeContent={unreadCount}
              color="primary"
              sx={{ ml: 1 }}
            >
              <NotificationIcon />
            </Badge>
          )}
        </Typography>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      <List>
        {notifications.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No notifications"
              secondary="You're all caught up!"
            />
          </ListItem>
        ) : (
          notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  bgcolor: notification.is_read ? 'transparent' : 'action.hover'
                }}
              >
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.message}
                      </Typography>
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true
                        })}
                      </Typography>
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction>
                  {!notification.is_read && (
                    <IconButton
                      edge="end"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))
        )}
      </List>

      {notifications.length >= page * limit && (
        <Box display="flex" justifyContent="center" p={2}>
          <Button onClick={handleLoadMore}>
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NotificationList; 