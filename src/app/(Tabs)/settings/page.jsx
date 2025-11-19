"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SettingsTabs from "./components/SettingsTabs";
import KYCForm from "./components/KYCForm";
import SecuritySettingsPage from "./components/SecuritySettingsPage";
import GeneralInfoForm from "./components/GeneralInfoForm";
import PayoutDetailsPage from "./components/PayoutDetailsPage";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("General Info");
  const [kycNeedsAction, setKycNeedsAction] = useState(false);

  // Check for tab query parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      // Validate that the tab exists
      const validTabs = ["General Info", "Business & KYC", "Payout Details", "Security"];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams]);

  // Check KYC status on mount
  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const response = await fetch('/api/vendor-kyc', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          const kyc = result.kyc;
          
          // Check if vendor needs to take action (resubmission or rejection)
          const needsAction = kyc?.documents?.resubmission_reason || 
                            kyc?.documents?.rejection_reason ||
                            kyc?.status === 'resubmission_required' ||
                            kyc?.status === 'rejected';
          
          setKycNeedsAction(!!needsAction);
        }
      } catch (err) {
        console.error('Error checking KYC status:', err);
      }
    };
    
    checkKycStatus();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Business & KYC":
        return <KYCForm />;
      case "General Info":
        return <GeneralInfoForm />;
      case "Payout Details":
        return <PayoutDetailsPage />;
      case "Security":
        return <SecuritySettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 w-[95vw] md:w-[80vw] space-y-6 overflow-hidden">
      <SettingsTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        kycNeedsAction={kycNeedsAction}
      />
      {renderTabContent()}
    </div>
  );
}
