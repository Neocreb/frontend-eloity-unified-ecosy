import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Search,
  UserPlus,
  Check,
  Clock,
  Eye,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { navigateToDirectChat, navigateToSendMoney } from "@/utils/navigationHelpers";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  isFollowing?: boolean;
  followsBack?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  bio?: string;
  followers?: number;
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "followers" | "following" | "viewers";
  users: User[];
  currentUser?: string;
}

const UserListModal: React.FC<UserListModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  users,
  currentUser,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

  useEffect(() => {
    // Initialize following states
    const states: Record<string, boolean> = {};
    users.forEach((user) => {
      states[user.id] = user.isFollowing || false;
    });
    setFollowingStates(states);
  }, [users]);

  const handleFollowToggle = (userId: string) => {
    setFollowingStates((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleUserClick = (username: string) => {
    navigate(`/app/profile/${username}`);
    onClose();
  };

  const handleMessage = (username: string) => {
    navigate(`/app/chat?user=${username}`);
    onClose();
  };

  const handleSendMoney = (username: string) => {
    navigate(`/app/wallet?action=send&recipient=${username}`);
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case "followers":
        return <UserPlus className="h-5 w-5" />;
      case "following":
        return <Users className="h-5 w-5" />;
      case "viewers":
        return <Eye className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getEmptyMessage = () => {
    switch (type) {
      case "followers":
        return "No followers yet";
      case "following":
        return "Not following anyone yet";
      case "viewers":
        return "No recent profile views";
      default:
        return "No users found";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg w-[95vw] sm:w-[90vw] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            {getIcon()}
            <span className="truncate">{title}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {filteredUsers.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 sm:px-6 py-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 sm:px-6 pb-4 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    {getIcon()}
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2">{getEmptyMessage()}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm px-4">
                    {searchQuery ? "No users match your search" : "Start connecting with people!"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar with online status */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer"
                        onClick={() => handleUserClick(user.username)}
                      >
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {user.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div
                        className="flex items-center gap-1 sm:gap-2 cursor-pointer"
                        onClick={() => handleUserClick(user.username)}
                      >
                        <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-[180px]">
                          {user.displayName.length > 15 ? `${user.displayName.slice(0, 15)}...` : user.displayName}
                        </span>
                        {user.verified && (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                        <span className="truncate max-w-[100px] sm:max-w-[140px]">
                          @{user.username.length > 12 ? `${user.username.slice(0, 12)}...` : user.username}
                        </span>
                        {user.followsBack && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 h-4 sm:h-5">
                            <span className="hidden sm:inline">Follows you</span>
                            <span className="sm:hidden">Follows</span>
                          </Badge>
                        )}
                      </div>
                      {type === "viewers" && user.lastSeen && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Viewed {user.lastSeen}</span>
                        </div>
                      )}
                      {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                          {user.bio.length > 40 ? `${user.bio.slice(0, 40)}...` : user.bio}
                        </p>
                      )}
                      {user.followers && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.followers.toLocaleString()} followers
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {user.username !== currentUser && (
                      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-shrink-0">
                        {type !== "viewers" && (
                          <Button
                            variant={followingStates[user.id] ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleFollowToggle(user.id)}
                            className="text-xs px-2 py-1 h-7 sm:h-8 w-full sm:w-auto"
                          >
                            {followingStates[user.id] ? (
                              <>
                                <Check className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Follow</span>
                              </>
                            )}
                          </Button>
                        )}

                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMessage(user.username)}
                            className="text-xs p-1 h-7 w-7 sm:h-8 sm:w-8"
                            title="Message"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMoney(user.username)}
                            className="text-xs p-1 h-7 w-7 sm:h-8 sm:w-8"
                            title="Send Money"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserListModal;
