import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { BusinessSettingsForm } from "@/components/settings/BusinessSettingsForm";

type SettingsTab = "general" | "business" | "security";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetFromSettings = () => {
    if (settings) {
      setFirstName(settings.first_name || "");
      setLastName(settings.last_name || "");
      setEmail(settings.email || user?.email || "");
      setCompanyName(settings.company_name || "");
    } else if (user) {
      setFirstName("");
      setLastName("");
      setEmail(user.email || "");
      setCompanyName("");
    }
  };

  useEffect(() => {
    if (settings) {
      setFirstName(settings.first_name || "");
      setLastName(settings.last_name || "");
      setEmail(settings.email || user?.email || "");
      setCompanyName(settings.company_name || "");
    } else if (user) {
      setEmail(user.email || "");
    }
  }, [settings, user]);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "general", label: "GENERAL" },
    { id: "business", label: "BUSINESS" },
    { id: "security", label: "SECURITY" },
  ];

  const handleSaveGeneral = async () => {
    // Basic client-side email check; mutation will also validate via zod.
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    await updateSettings.mutateAsync({
      first_name: firstName,
      last_name: lastName,
      email,
      company_name: companyName,
    });
  };


  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Call the edge function to delete user data and auth record
      const { error } = await supabase.functions.invoke("delete-account");
      
      if (error) {
        throw new Error(error.message || "Failed to delete account");
      }
      
      // Sign out the user (session cleanup)
      await signOut();
      toast.success("Account deleted successfully");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="px-4 md:px-8 py-6 md:py-10 border-b border-border">
        <h1 className="page-title">SETTINGS</h1>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 md:px-8 border-b border-border pb-4 pt-6">
        <div className="flex items-center gap-6 md:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item transition-colors ${
                activeTab === tab.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col">

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {activeTab === "general" && (
            <div className="max-w-3xl">
              <h2 className="section-header mb-6 md:mb-8">PROFILE DETAILS</h2>

              {/* Avatar Section */}
              <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-billie-green flex items-center justify-center">
                  <span className="font-display text-2xl md:text-3xl text-background">
                    {firstName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="meta-text tracking-wide text-muted-foreground">
                    AVATAR FROM INITIALS
                  </span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 md:space-y-6">
                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label className="form-label">FIRST NAME</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-10 md:h-12 bg-card border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="form-label">LAST NAME</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-10 md:h-12 bg-card border-border text-foreground text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="form-label">EMAIL ADDRESS</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 md:h-12 bg-card border-border text-foreground text-sm"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <Label className="form-label">COMPANY NAME</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-10 md:h-12 bg-card border-border text-foreground text-sm"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={resetFromSettings}
                    disabled={updateSettings.isPending}
                    variant="outline"
                    className="h-10 md:h-11 px-6 border-border hover:bg-muted btn-text w-full sm:w-auto"
                  >
                    CANCEL
                  </Button>
                  <Button 
                    onClick={handleSaveGeneral}
                    disabled={updateSettings.isPending}
                    className="h-10 md:h-11 px-6 bg-billie-green hover:bg-billie-green/90 text-white btn-text w-full sm:w-auto"
                  >
                    {updateSettings.isPending ? "SAVING..." : "SAVE CHANGES"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "business" && <BusinessSettingsForm />}

          {activeTab === "security" && (
            <div className="max-w-3xl">
              <h2 className="section-header mb-6 md:mb-8">SECURITY</h2>
              
              <div className="space-y-6">
                <div className="pt-4">
                  <span className="form-label block mb-4">ACCOUNT ACTIONS</span>
                  <div className="flex flex-col gap-3 md:gap-4">
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="outline"
                      className="h-10 md:h-11 px-6 border-destructive text-destructive hover:bg-destructive/10 btn-text w-full sm:w-48"
                    >
                      DELETE ACCOUNT
                    </Button>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="h-10 md:h-11 px-6 border-border hover:bg-muted btn-text w-full sm:w-48"
                    >
                      LOG OUT
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border mx-4 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="section-header text-lg md:text-xl">
              DELETE ACCOUNT
            </AlertDialogTitle>
            <AlertDialogDescription className="body-text-muted">
              Are you sure you want to delete your account? This action is permanent and cannot be undone.
              All your data, including invoices, clients, and settings, will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-10 md:h-11 px-6 border-border hover:bg-muted btn-text">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="h-10 md:h-11 px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground btn-text"
            >
              {isDeleting ? "DELETING..." : "DELETE"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
