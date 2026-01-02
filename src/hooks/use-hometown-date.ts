import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Timezone mapping based on approximate longitude
// This is a simplified approach - for more accuracy, a full timezone database would be needed
const getTimezoneFromCoords = (lat: number, lng: number): string => {
  // Special cases for some regions
  if (lng >= 127 && lng <= 146 && lat >= 30 && lat <= 46) {
    return "Asia/Tokyo"; // Japan
  }
  if (lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54) {
    // China uses single timezone
    if (lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54) {
      return "Asia/Shanghai";
    }
  }
  
  // General approach: convert longitude to timezone offset
  // Each 15 degrees of longitude = 1 hour difference from UTC
  const offsetHours = Math.round(lng / 15);
  
  // Map common timezone offsets to IANA timezone names
  const timezoneMap: Record<number, string> = {
    "-12": "Etc/GMT+12",
    "-11": "Pacific/Midway",
    "-10": "Pacific/Honolulu",
    "-9": "America/Anchorage",
    "-8": "America/Los_Angeles",
    "-7": "America/Denver",
    "-6": "America/Chicago",
    "-5": "America/New_York",
    "-4": "America/Halifax",
    "-3": "America/Sao_Paulo",
    "-2": "Atlantic/South_Georgia",
    "-1": "Atlantic/Azores",
    "0": "UTC",
    "1": "Europe/Paris",
    "2": "Europe/Helsinki",
    "3": "Europe/Moscow",
    "4": "Asia/Dubai",
    "5": "Asia/Karachi",
    "6": "Asia/Dhaka",
    "7": "Asia/Bangkok",
    "8": "Asia/Singapore",
    "9": "Asia/Tokyo",
    "10": "Australia/Sydney",
    "11": "Pacific/Noumea",
    "12": "Pacific/Auckland",
  };
  
  return timezoneMap[offsetHours] || "UTC";
};

export const getHometownDate = (
  hometownLat: number | null, 
  hometownLng: number | null
): string => {
  const now = new Date();
  
  if (hometownLat != null && hometownLng != null) {
    try {
      const timezone = getTimezoneFromCoords(hometownLat, hometownLng);
      const zonedDate = toZonedTime(now, timezone);
      return format(zonedDate, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error calculating hometown date:", error);
    }
  }
  
  // Fallback to browser's local date
  return format(now, "yyyy-MM-dd");
};

interface UseHometownDateResult {
  todayDate: string;
  loading: boolean;
  timezone: string | null;
}

export const useHometownDate = (userId: string | null): UseHometownDateResult => {
  const [todayDate, setTodayDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    const loadHometownAndCalculateDate = async () => {
      if (!userId) {
        setTodayDate(format(new Date(), "yyyy-MM-dd"));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("hometown_latitude, hometown_longitude")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        if (data?.hometown_latitude != null && data?.hometown_longitude != null) {
          const tz = getTimezoneFromCoords(data.hometown_latitude, data.hometown_longitude);
          setTimezone(tz);
          setTodayDate(getHometownDate(data.hometown_latitude, data.hometown_longitude));
        } else {
          // No hometown set, use browser's local date
          setTodayDate(format(new Date(), "yyyy-MM-dd"));
        }
      } catch (error) {
        console.error("Error loading hometown:", error);
        setTodayDate(format(new Date(), "yyyy-MM-dd"));
      } finally {
        setLoading(false);
      }
    };

    loadHometownAndCalculateDate();
  }, [userId]);

  return { todayDate, loading, timezone };
};
