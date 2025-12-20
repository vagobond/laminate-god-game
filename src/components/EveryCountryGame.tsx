import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Globe, Mail, MapPin, Check, Clock, X, Users } from "lucide-react";

interface Invite {
  id: string;
  invitee_email: string;
  target_country: string | null;
  is_new_country: boolean;
  status: string;
  created_at: string;
}

interface AvailableInvites {
  existing_country_remaining: number;
  new_country_remaining: number;
}

export const EveryCountryGame = () => {
  const [user, setUser] = useState<any>(null);
  const [hasHometown, setHasHometown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [availableInvites, setAvailableInvites] = useState<AvailableInvites>({ existing_country_remaining: 0, new_country_remaining: 0 });
  const [representedCountries, setRepresentedCountries] = useState<string[]>([]);
  const [allCountries, setAllCountries] = useState<string[]>([]);
  
  // Form state
  const [inviteType, setInviteType] = useState<"existing" | "new">("existing");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await Promise.all([
        checkHometown(session.user.id),
        loadInvites(session.user.id),
        loadAvailableInvites(session.user.id),
        loadCountries()
      ]);
    }
    setLoading(false);
  };

  const checkHometown = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("hometown_country")
      .eq("id", userId)
      .single();
    
    setHasHometown(!!data?.hometown_country);
  };

  const loadInvites = async (userId: string) => {
    const { data } = await supabase
      .from("country_invites")
      .select("*")
      .eq("inviter_id", userId)
      .order("created_at", { ascending: false });
    
    setInvites(data || []);
  };

  const loadAvailableInvites = async (userId: string) => {
    const { data, error } = await supabase.rpc("get_available_invites", { user_id: userId });
    if (data && data.length > 0) {
      setAvailableInvites(data[0]);
    }
  };

  const loadCountries = async () => {
    // Get all countries that have users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("hometown_country")
      .not("hometown_country", "is", null);
    
    const countries = [...new Set(profiles?.map(p => p.hometown_country).filter(Boolean) as string[])];
    setRepresentedCountries(countries.sort());

    // List of all countries
    const worldCountries = [
      "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
      "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
      "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
      "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
      "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
      "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
      "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
      "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
      "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea North", "Korea South", "Kosovo",
      "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
      "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
      "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
      "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
      "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
      "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
      "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
      "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
      "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
      "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
      "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ];
    setAllCountries(worldCountries);
  };

  const handleSendInvite = async () => {
    if (!inviteeEmail.trim()) {
      toast({ title: "Please enter an email address", variant: "destructive" });
      return;
    }

    if (inviteType === "existing" && !selectedCountry) {
      toast({ title: "Please select a country", variant: "destructive" });
      return;
    }

    if (inviteType === "existing" && availableInvites.existing_country_remaining <= 0) {
      toast({ title: "No existing country invites remaining", variant: "destructive" });
      return;
    }

    if (inviteType === "new" && availableInvites.new_country_remaining <= 0) {
      toast({ title: "No new country invites remaining", variant: "destructive" });
      return;
    }

    setSending(true);

    const { error } = await supabase.from("country_invites").insert({
      inviter_id: user.id,
      invitee_email: inviteeEmail.trim().toLowerCase(),
      target_country: inviteType === "existing" ? selectedCountry : null,
      is_new_country: inviteType === "new"
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "You've already invited this person", variant: "destructive" });
      } else {
        toast({ title: "Failed to send invite", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Invite sent!", description: `Invitation sent to ${inviteeEmail}` });
      setInviteeEmail("");
      setSelectedCountry("");
      await Promise.all([
        loadInvites(user.id),
        loadAvailableInvites(user.id)
      ]);
    }

    setSending(false);
  };

  const handleCancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("country_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      toast({ title: "Failed to cancel invite", variant: "destructive" });
    } else {
      toast({ title: "Invite cancelled" });
      await Promise.all([
        loadInvites(user.id),
        loadAvailableInvites(user.id)
      ]);
    }
  };

  const unrepresentedCountries = allCountries.filter(c => !representedCountries.includes(c));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "accepted":
        return <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> Signed Up</Badge>;
      case "completed":
        return <Badge className="gap-1 bg-green-600"><MapPin className="h-3 w-3" /> Hometown Added</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-card/60 backdrop-blur">
        <CardContent className="p-6">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-primary/20 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Every Country in the World
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to participate.</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasHometown) {
    return (
      <Card className="border-primary/20 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Every Country in the World
          </CardTitle>
          <CardDescription>Help us get a user from every country!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To participate in this challenge, you need to claim your hometown first.
          </p>
          <Button onClick={() => window.location.href = "/irl-layer"}>
            <MapPin className="mr-2 h-4 w-4" />
            Claim Your Hometown
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalInvitesAvailable = availableInvites.existing_country_remaining + availableInvites.new_country_remaining;

  return (
    <Card className="border-primary/20 bg-card/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Every Country in the World
        </CardTitle>
        <CardDescription>
          Help us get a user from every country! Currently {representedCountries.length} of {allCountries.length} countries represented.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-primary">{representedCountries.length}</div>
            <div className="text-sm text-muted-foreground">Countries Represented</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-primary">{unrepresentedCountries.length}</div>
            <div className="text-sm text-muted-foreground">Countries Needed</div>
          </div>
        </div>

        {/* Invite Form */}
        {totalInvitesAvailable > 0 ? (
          <div className="space-y-4 p-4 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Send Invites
              </h3>
              <div className="text-sm text-muted-foreground">
                {availableInvites.existing_country_remaining} existing + {availableInvites.new_country_remaining} new country invites
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Invite Type</Label>
                <Select value={inviteType} onValueChange={(v) => setInviteType(v as "existing" | "new")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing" disabled={availableInvites.existing_country_remaining <= 0}>
                      Existing Country ({availableInvites.existing_country_remaining} left)
                    </SelectItem>
                    <SelectItem value="new" disabled={availableInvites.new_country_remaining <= 0}>
                      New Country ({availableInvites.new_country_remaining} left)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inviteType === "existing" && (
                <div className="space-y-2">
                  <Label>Select Country (must be represented)</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {representedCountries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {inviteType === "new" && (
                <p className="text-sm text-muted-foreground">
                  Invite someone from a country not yet represented. They'll need to add their hometown from that country.
                </p>
              )}

              <div className="space-y-2">
                <Label>Invitee Email</Label>
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={inviteeEmail}
                  onChange={(e) => setInviteeEmail(e.target.value)}
                />
              </div>

              <Button onClick={handleSendInvite} disabled={sending} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-background/50 border text-center">
            <p className="text-muted-foreground">
              You've used all your invites! Once your invitees add their hometowns, you'll receive 3 more invites.
            </p>
          </div>
        )}

        {/* Sent Invites */}
        {invites.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Your Invites</h3>
            <div className="space-y-2">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                  <div className="space-y-1">
                    <div className="font-medium">{invite.invitee_email}</div>
                    <div className="text-sm text-muted-foreground">
                      {invite.is_new_country ? "New Country" : invite.target_country}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invite.status)}
                    {invite.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unrepresented Countries Preview */}
        <div className="space-y-2">
          <h3 className="font-semibold">Countries We Need ({unrepresentedCountries.length})</h3>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {unrepresentedCountries.slice(0, 50).map(country => (
              <Badge key={country} variant="outline" className="text-xs">{country}</Badge>
            ))}
            {unrepresentedCountries.length > 50 && (
              <Badge variant="secondary" className="text-xs">+{unrepresentedCountries.length - 50} more</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
