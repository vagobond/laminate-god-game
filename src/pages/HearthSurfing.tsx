import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Search, 
  Home, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  Save,
  MapPin,
  Users,
  Heart
} from "lucide-react";
import { toast } from "sonner";
import { HostingRequestDialog } from "@/components/HostingRequestDialog";

interface HostingPreferences {
  id?: string;
  user_id: string;
  is_open_to_hosting: boolean;
  hosting_description: string | null;
  accommodation_type: string | null;
  max_guests: number;
  min_friendship_level: string;
  compensation_type_preferred: string;
}

interface HostProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  hometown_city: string | null;
  hometown_country: string | null;
  hosting_preferences: HostingPreferences;
}

interface HostingRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: string;
  arrival_date: string | null;
  departure_date: string | null;
  num_guests: number | null;
  response_message: string | null;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  to_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const COMPENSATION_TYPES = [
  { value: "none", label: "None" },
  { value: "monetary", label: "Monetary" },
  { value: "food", label: "Food" },
  { value: "hangout_time", label: "Hangout Time" },
  { value: "friendship", label: "Friendship" },
  { value: "fwb", label: "FWB" },
];

const ACCOMMODATION_TYPES = [
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "couch", label: "Couch" },
  { value: "floor_space", label: "Floor Space" },
  { value: "guest_house", label: "Guest House / Separate Unit" },
];

const HearthSurfing = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [hosts, setHosts] = useState<HostProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // My hosting preferences state
  const [preferences, setPreferences] = useState<HostingPreferences>({
    user_id: "",
    is_open_to_hosting: false,
    hosting_description: null,
    accommodation_type: null,
    max_guests: 1,
    min_friendship_level: "buddy",
    compensation_type_preferred: "none",
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Requests state
  const [incomingRequests, setIncomingRequests] = useState<HostingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<HostingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadRequests();
      searchHosts();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("hosting_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          user_id: data.user_id,
          is_open_to_hosting: data.is_open_to_hosting,
          hosting_description: data.hosting_description,
          accommodation_type: data.accommodation_type,
          max_guests: data.max_guests || 1,
          min_friendship_level: data.min_friendship_level,
          compensation_type_preferred: (data as any).compensation_type_preferred || "none",
        });
      } else {
        setPreferences(prev => ({ ...prev, user_id: user.id }));
      }
    } catch (error) {
      console.error("Error loading hosting preferences:", error);
    } finally {
      setPrefsLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!user) return;
    try {
      // Load incoming requests
      const { data: incoming, error: inError } = await supabase
        .from("hosting_requests")
        .select("*")
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false });

      if (inError) throw inError;

      // Load outgoing requests
      const { data: outgoing, error: outError } = await supabase
        .from("hosting_requests")
        .select("*")
        .eq("from_user_id", user.id)
        .order("created_at", { ascending: false });

      if (outError) throw outError;

      // Batch fetch profiles
      const allUserIds = [
        ...new Set([
          ...(incoming || []).map(r => r.from_user_id),
          ...(outgoing || []).map(r => r.to_user_id),
        ]),
      ];

      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", allUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        setIncomingRequests(
          (incoming || []).map(r => ({
            ...r,
            from_profile: profileMap.get(r.from_user_id),
          }))
        );

        setOutgoingRequests(
          (outgoing || []).map(r => ({
            ...r,
            to_profile: profileMap.get(r.to_user_id),
          }))
        );
      } else {
        setIncomingRequests(incoming || []);
        setOutgoingRequests(outgoing || []);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const searchHosts = async () => {
    setSearchLoading(true);
    try {
      let query = supabase
        .from("hosting_preferences")
        .select("*, profiles!hosting_preferences_user_id_fkey(id, display_name, avatar_url, hometown_city, hometown_country)")
        .eq("is_open_to_hosting", true);

      const { data, error } = await query;

      if (error) throw error;

      const hostProfiles: HostProfile[] = (data || [])
        .filter((d: any) => d.profiles && d.user_id !== user?.id)
        .map((d: any) => ({
          id: d.profiles.id,
          display_name: d.profiles.display_name,
          avatar_url: d.profiles.avatar_url,
          hometown_city: d.profiles.hometown_city,
          hometown_country: d.profiles.hometown_country,
          hosting_preferences: {
            id: d.id,
            user_id: d.user_id,
            is_open_to_hosting: d.is_open_to_hosting,
            hosting_description: d.hosting_description,
            accommodation_type: d.accommodation_type,
            max_guests: d.max_guests,
            min_friendship_level: d.min_friendship_level,
            compensation_type_preferred: d.compensation_type_preferred || "none",
          },
        }));

      // Filter by search query
      const filtered = searchQuery
        ? hostProfiles.filter(h => 
            h.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.hometown_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.hometown_country?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : hostProfiles;

      setHosts(filtered);
    } catch (error) {
      console.error("Error searching hosts:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const prefData = {
        user_id: user.id,
        is_open_to_hosting: preferences.is_open_to_hosting,
        hosting_description: preferences.hosting_description,
        accommodation_type: preferences.accommodation_type,
        max_guests: preferences.max_guests,
        min_friendship_level: preferences.min_friendship_level,
        compensation_type_preferred: preferences.compensation_type_preferred,
      };

      if (preferences.id) {
        const { error } = await supabase
          .from("hosting_preferences")
          .update(prefData)
          .eq("id", preferences.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("hosting_preferences")
          .insert(prefData)
          .select()
          .single();
        if (error) throw error;
        setPreferences(prev => ({ ...prev, id: data.id }));
      }

      toast.success("Hosting preferences saved!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestResponse = async (requestId: string, status: "accepted" | "declined", responseMessage?: string) => {
    try {
      const { error } = await supabase
        .from("hosting_requests")
        .update({ 
          status, 
          response_message: responseMessage || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
      toast.success(`Request ${status}!`);
      loadRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    }
  };

  const getCompensationLabel = (value: string) => {
    return COMPENSATION_TYPES.find(c => c.value === value)?.label || value;
  };

  const getAccommodationLabel = (value: string | null) => {
    return ACCOMMODATION_TYPES.find(a => a.value === value)?.label || value;
  };

  if (authLoading || prefsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingIncoming = incomingRequests.filter(r => r.status === "pending");
  const pendingOutgoing = outgoingRequests.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            Hearth Surfing
          </h1>
          <p className="text-muted-foreground">
            Find hosts, manage your hosting preferences, and connect with travelers
          </p>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Hosts
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Requests
              {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingIncoming.length + pendingOutgoing.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-space" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              My Space
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={searchHosts} disabled={searchLoading}>
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            {searchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : hosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hosts found matching your search</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {hosts.map((host) => (
                  <Card key={host.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar 
                          className="w-14 h-14 cursor-pointer"
                          onClick={() => navigate(`/u/${host.id}`)}
                        >
                          <AvatarImage src={host.avatar_url || undefined} />
                          <AvatarFallback>
                            {(host.display_name || "H").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-semibold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/u/${host.id}`)}
                          >
                            {host.display_name || "Anonymous Host"}
                          </h3>
                          {(host.hometown_city || host.hometown_country) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[host.hometown_city, host.hometown_country].filter(Boolean).join(", ")}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {host.hosting_preferences.accommodation_type && (
                              <Badge variant="secondary">
                                {getAccommodationLabel(host.hosting_preferences.accommodation_type)}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              Max {host.hosting_preferences.max_guests} guest{host.hosting_preferences.max_guests !== 1 ? "s" : ""}
                            </Badge>
                            {host.hosting_preferences.compensation_type_preferred !== "none" && (
                              <Badge variant="outline" className="text-primary border-primary">
                                {getCompensationLabel(host.hosting_preferences.compensation_type_preferred)}
                              </Badge>
                            )}
                          </div>
                          {host.hosting_preferences.hosting_description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {host.hosting_preferences.hosting_description}
                            </p>
                          )}
                        </div>
                        <HostingRequestDialog
                          recipientId={host.id}
                          recipientName={host.display_name || "Host"}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Incoming Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Incoming Requests</CardTitle>
                    <CardDescription>People who want to stay with you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {incomingRequests.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No incoming requests</p>
                    ) : (
                      <div className="space-y-3">
                        {incomingRequests.map((request) => (
                          <div key={request.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={request.from_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(request.from_profile?.display_name || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">
                                {request.from_profile?.display_name || "Unknown User"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.arrival_date && request.departure_date
                                  ? `${new Date(request.arrival_date).toLocaleDateString()} - ${new Date(request.departure_date).toLocaleDateString()}`
                                  : "Dates not specified"}
                                {request.num_guests && ` • ${request.num_guests} guest${request.num_guests !== 1 ? "s" : ""}`}
                              </p>
                              <p className="text-sm mt-1">{request.message}</p>
                              <Badge 
                                variant={request.status === "pending" ? "outline" : request.status === "accepted" ? "default" : "destructive"}
                                className="mt-2"
                              >
                                {request.status}
                              </Badge>
                            </div>
                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleRequestResponse(request.id, "accepted")}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRequestResponse(request.id, "declined")}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Outgoing Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">My Requests</CardTitle>
                    <CardDescription>Your hosting requests to others</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {outgoingRequests.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No outgoing requests</p>
                    ) : (
                      <div className="space-y-3">
                        {outgoingRequests.map((request) => (
                          <div key={request.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={request.to_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(request.to_profile?.display_name || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">
                                {request.to_profile?.display_name || "Unknown User"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.arrival_date && request.departure_date
                                  ? `${new Date(request.arrival_date).toLocaleDateString()} - ${new Date(request.departure_date).toLocaleDateString()}`
                                  : "Dates not specified"}
                              </p>
                              <Badge 
                                variant={request.status === "pending" ? "outline" : request.status === "accepted" ? "default" : "destructive"}
                                className="mt-2"
                              >
                                {request.status}
                              </Badge>
                              {request.response_message && (
                                <p className="text-sm text-muted-foreground mt-1 italic">
                                  Response: {request.response_message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* My Space Tab */}
          <TabsContent value="my-space" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Your Hosting Space
                </CardTitle>
                <CardDescription>
                  Configure what you offer to travelers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="hosting-toggle">Open to Hosting</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow friends to request to stay with you
                    </p>
                  </div>
                  <Switch
                    id="hosting-toggle"
                    checked={preferences.is_open_to_hosting}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, is_open_to_hosting: checked })
                    }
                  />
                </div>

                {preferences.is_open_to_hosting && (
                  <>
                    <div className="space-y-2">
                      <Label>Who can request hosting?</Label>
                      <Select
                        value={preferences.min_friendship_level}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, min_friendship_level: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly_acquaintance">Friendly Acquaintances & Above</SelectItem>
                          <SelectItem value="buddy">Buddies & Above</SelectItem>
                          <SelectItem value="close_friend">Close Friends Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Accommodation Type</Label>
                      <Select
                        value={preferences.accommodation_type || ""}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, accommodation_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select accommodation type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOMMODATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Maximum Guests</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={preferences.max_guests}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            max_guests: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Compensation Type Preferred</Label>
                      <Select
                        value={preferences.compensation_type_preferred}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, compensation_type_preferred: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPENSATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Let guests know what form of appreciation you prefer
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Describe your hosting situation</Label>
                      <Textarea
                        placeholder="e.g., I have a spare room with a comfortable bed, shared bathroom. Quiet neighborhood, close to public transit. Pets in the house. Kitchen access available..."
                        value={preferences.hosting_description || ""}
                        onChange={(e) =>
                          setPreferences({ ...preferences, hosting_description: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <Button onClick={handleSavePreferences} disabled={saving} className="w-full">
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Hosting Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default HearthSurfing;
