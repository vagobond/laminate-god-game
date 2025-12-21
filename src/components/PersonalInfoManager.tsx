import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cake, Home, Mail, User2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VisibilityLevel = "close_friend" | "buddy" | "friendly_acquaintance" | "nobody";

interface PersonalInfoData {
  birthday_day: number | null;
  birthday_month: number | null;
  birthday_year: number | null;
  home_address: string | null;
  mailing_address: string | null;
  nicknames: string | null;
  birthday_no_year_visibility: VisibilityLevel;
  birthday_year_visibility: VisibilityLevel;
  home_address_visibility: VisibilityLevel;
  mailing_address_visibility: VisibilityLevel;
  nicknames_visibility: VisibilityLevel;
}

interface PersonalInfoManagerProps {
  userId: string;
  data: PersonalInfoData;
  onChange: (data: PersonalInfoData) => void;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const VISIBILITY_OPTIONS = [
  { value: "nobody", label: "Nobody", description: "Hidden from all friends" },
  { value: "close_friend", label: "Close Friends", description: "Only close friends can see" },
  { value: "buddy", label: "Buddies+", description: "Buddies and above can see" },
  { value: "friendly_acquaintance", label: "Acquaintances+", description: "All friends can see" },
];

const VisibilitySelect = ({
  value,
  onChange,
  label,
}: {
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <Label className="text-xs text-muted-foreground whitespace-nowrap">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VISIBILITY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export function PersonalInfoManager({ userId, data, onChange }: PersonalInfoManagerProps) {
  const handleChange = <K extends keyof PersonalInfoData>(field: K, value: PersonalInfoData[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Generate days based on selected month
  const getDaysInMonth = (month: number | null, year: number | null) => {
    if (!month) return 31;
    const daysInMonth = new Date(year || 2024, month, 0).getDate();
    return daysInMonth;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: getDaysInMonth(data.birthday_month, data.birthday_year) }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <User2 className="w-5 h-5" />
          Personal Information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control who can see your personal details based on friendship level
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Birthday Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cake className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Birthday</Label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={data.birthday_month?.toString() || ""}
              onValueChange={(v) => handleChange("birthday_month", v ? parseInt(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={data.birthday_day?.toString() || ""}
              onValueChange={(v) => handleChange("birthday_day", v ? parseInt(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={data.birthday_year?.toString() || "no_year"}
              onValueChange={(v) => handleChange("birthday_year", v === "no_year" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Year (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_year">No year</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-1">
            <VisibilitySelect
              value={data.birthday_no_year_visibility}
              onChange={(v) => handleChange("birthday_no_year_visibility", v)}
              label="Birthday (month/day):"
            />
            <VisibilitySelect
              value={data.birthday_year_visibility}
              onChange={(v) => handleChange("birthday_year_visibility", v)}
              label="Birth year:"
            />
          </div>
        </div>

        {/* Nicknames Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User2 className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Nickname(s)</Label>
          </div>
          <Input
            value={data.nicknames || ""}
            onChange={(e) => handleChange("nicknames", e.target.value || null)}
            placeholder="What do your friends call you?"
          />
          <VisibilitySelect
            value={data.nicknames_visibility}
            onChange={(v) => handleChange("nicknames_visibility", v)}
            label="Visible to:"
          />
        </div>

        {/* Home Address Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Home Address</Label>
          </div>
          <Input
            value={data.home_address || ""}
            onChange={(e) => handleChange("home_address", e.target.value || null)}
            placeholder="Your home address"
          />
          <VisibilitySelect
            value={data.home_address_visibility}
            onChange={(v) => handleChange("home_address_visibility", v)}
            label="Visible to:"
          />
        </div>

        {/* Mailing Address Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <Label className="font-medium">Mailing Address</Label>
          </div>
          <Input
            value={data.mailing_address || ""}
            onChange={(e) => handleChange("mailing_address", e.target.value || null)}
            placeholder="Where should people send mail?"
          />
          <p className="text-xs text-muted-foreground">
            Use this if different from home address (e.g., PO Box)
          </p>
          <VisibilitySelect
            value={data.mailing_address_visibility}
            onChange={(v) => handleChange("mailing_address_visibility", v)}
            label="Visible to:"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export type { PersonalInfoData, VisibilityLevel };
