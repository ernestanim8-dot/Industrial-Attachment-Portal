import { useState } from 'react';
import { Bell, Check, FileText, UserPlus, Info, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { useNotifications } from '../context/NotificationContext';
import { Notification } from '../types';
import { Link } from 'react-router';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'report_submitted':
        return <FileText className={iconClass} />;
      case 'report_graded':
      case 'assessment':
        return <Check className={iconClass} />;
      case 'supervisor_assigned':
      case 'assignment':
        return <UserPlus className={iconClass} />;
      case 'deadline':
        return <Calendar className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'report_submitted':
        return 'bg-blue-100 text-blue-700';
      case 'report_graded':
      case 'assessment':
        return 'bg-green-100 text-green-700';
      case 'supervisor_assigned':
      case 'assignment':
        return 'bg-purple-100 text-purple-700';
      case 'deadline':
        return 'bg-red-100 text-red-700';
      case 'feedback':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="flex flex-row items-center justify-between pb-2 border-bottom">
          <div>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              Stay updated on your attachment progress.
            </SheetDescription>
          </div>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications
                .map((notification) => (
                  <div
                    key={notification.id || notification._id}
                    className={`p-3 rounded-lg border transition-colors ${
                      notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {notification.title && (
                              <h5 className={`font-semibold text-xs mb-0.5 ${!notification.read ? 'text-blue-800' : 'text-gray-500'}`}>
                                {notification.title}
                              </h5>
                            )}
                            <h4 className={`font-medium text-sm ${!notification.read ? 'text-blue-900' : ''}`}>
                              {notification.message}
                            </h4>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => markAsRead(notification.id || notification._id || '')}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </span>
                          {notification.link && (
                            <Link 
                              to={notification.link} 
                              className="text-xs text-blue-600 hover:underline"
                              onClick={() => {
                                markAsRead(notification.id || notification._id || '');
                                setIsOpen(false);
                              }}
                            >
                              View details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}