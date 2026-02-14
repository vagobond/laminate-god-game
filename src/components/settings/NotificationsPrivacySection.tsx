import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Shield } from "lucide-react";
import type { UserSettings } from "./useSettingsData";

interface NotificationsPrivacySectionProps {
  settings: UserSettings;
  onSettingChange: <K extends keyof UserSettings>(setting: K, value: UserSettings[K]) => void;
}

export const NotificationsPrivacySection = ({ settings, onSettingChange }: NotificationsPrivacySectionProps) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings.email_notifications}
            onCheckedChange={(checked) => onSettingChange("email_notifications", checked)}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="friend-request-notifications">Friend Request Alerts</Label>
            <p className="text-sm text-muted-foreground">Get notified when someone sends you a friend request</p>
          </div>
          <Switch
            id="friend-request-notifications"
            checked={settings.friend_request_notifications}
            onCheckedChange={(checked) => onSettingChange("friend_request_notifications", checked)}
          />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy
        </CardTitle>
        <CardDescription>Control your visibility and accessibility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="online-status">Show Online Status</Label>
            <p className="text-sm text-muted-foreground">Let others see when you're online</p>
          </div>
          <Switch
            id="online-status"
            checked={settings.show_online_status}
            onCheckedChange={(checked) => onSettingChange("show_online_status", checked)}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-friend-requests">Allow Friend Requests</Label>
            <p className="text-sm text-muted-foreground">Let others send you friend requests</p>
          </div>
          <Switch
            id="allow-friend-requests"
            checked={settings.allow_friend_requests}
            onCheckedChange={(checked) => onSettingChange("allow_friend_requests", checked)}
          />
        </div>
      </CardContent>
    </Card>
  </>
);
