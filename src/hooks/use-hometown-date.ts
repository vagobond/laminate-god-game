import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

// Timezone mapping based on approximate longitude
// This is a simplified approach - for more accuracy, a full timezone database would be needed
const getTimezoneFromCoords = (lat: number, lng: number): string => {
  // Special cases for some regions
  if (lng >= 127 && lng <= 146 && lat >= 24 && lat <= 46) {
    return "Asia/Tokyo"; // Japan (includes Okinawa to Hokkaido)
  }
  if (lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54) {
    // China uses single timezone
    return "Asia/Shanghai";
  }
  
  // General approach: convert longitude to timezone offset
  // Each 15 degrees of longitude = 1 hour difference from UTC
  const offsetHours = Math.round(lng / 15);
  
  // Map common timezone offsets to IANA timezone names
  const timezoneMap: Record<number, string> = {
    [-12]: "Etc/GMT+12",
    [-11]: "Pacific/Midway",
    [-10]: "Pacific/Honolulu",
    [-9]: "America/Anchorage",
    [-8]: "America/Los_Angeles",
    [-7]: "America/Denver",
    [-6]: "America/Chicago",
    [-5]: "America/New_York",
    [-4]: "America/Halifax",
    [-3]: "America/Sao_Paulo",
    [-2]: "Atlantic/South_Georgia",
    [-1]: "Atlantic/Azores",
    [0]: "UTC",
    [1]: "Europe/Paris",
    [2]: "Europe/Helsinki",
    [3]: "Europe/Moscow",
    [4]: "Asia/Dubai",
    [5]: "Asia/Karachi",
    [6]: "Asia/Dhaka",
    [7]: "Asia/Bangkok",
    [8]: "Asia/Singapore",
    [9]: "Asia/Tokyo",
    [10]: "Australia/Sydney",
    [11]: "Pacific/Noumea",
    [12]: "Pacific/Auckland",
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
      // Use formatInTimeZone to get the date in the target timezone
      // This properly handles the timezone conversion and formatting together
      return formatInTimeZone(now, timezone, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error calculating hometown date:", error);
    }
  }
  
  // Fallback to browser's local date using Intl
  const localDate = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  }).format(now);
  return localDate;
};

interface UseHometownDateResult {
  todayDate: string;
  loading: boolean;
  timezone: string | null;
}

const getLocalDate = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  }).format(new Date());
};

export const useHometownDate = (userId: string | null): UseHometownDateResult => {
  const [todayDate, setTodayDate] = useState<string>(getLocalDate());
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    const loadHometownAndCalculateDate = async () => {
      if (!userId) {
        setTodayDate(getLocalDate());
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
          setTodayDate(getLocalDate());
        }
      } catch (error) {
        console.error("Error loading hometown:", error);
        setTodayDate(getLocalDate());
      } finally {
        setLoading(false);
      }
    };

    loadHometownAndCalculateDate();
  }, [userId]);

  return { todayDate, loading, timezone };
};
