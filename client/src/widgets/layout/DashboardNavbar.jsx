import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Navbar, IconButton, Dialog } from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import {
  OrganizationProfile,
  SignedIn,
  useClerk,
  useOrganization,
  UserButton,
  UserProfile,
  useUser,
} from "@clerk/clerk-react";

import BargainwaleIcon from "@/assets/logo.svg";
import WhatsappIcon from "@/assets/whatsapp_icon.svg";
import GmailIcon from "@/assets/gmail_icon.svg";
import BitbucketIcon from "@/assets/bitbucket_icon.svg";
import EmailIcon from "@/assets/google_icon.svg";
import GithubIcon from "@/assets/github_icon.svg";
import FirebaseIcon from "@/assets/firebase_icon.svg";

import {
  Bars3Icon,
  BuildingOfficeIcon,
  ArrowsPointingOutIcon,
  Squares2X2Icon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";
import UserProfileDropdown from "./ProfileButton";
import { BuildingIcon } from "lucide-react";
import ManageOrganizationProfile from "@/pages/auth/OrganizationProfile";

export function DashboardNavbar() {
  const { pathname } = useLocation();
  const [layout, page] = pathname.split("/").filter((el) => el !== "");
  const [openOrgProfile, setOpenOrgProfile] = useState(false);
  const [openOrgProf, setOpenOrgProf] = useState(false);
  const [openUserProfile, setOpenUserProfile] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();
  const navigate = useNavigate();

  const handleOpenOrgProfile = () => setOpenOrgProfile(!openOrgProfile);
  const handleOpenOrgProf = () => setOpenOrgProf(!openOrgProf);
  const handleOpenUserProfile = () => setOpenUserProfile(!openUserProfile);
  const toggleAppMenu = () => setShowAppMenu(!showAppMenu);

  const handleSync = async () => {
    setLastSyncTime(0);
    await fetchData();
    window.location.reload();
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/${organization?.id}/organization`
      );
      if (response.status === 200) {
        if (!localStorage.getItem("clerk_active_org")) {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime((prevTime) => prevTime + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (organization !== null) {
      fetchData();
    } else {
      navigate("/auth/create-organization");
    }
  }, [organization, navigate]);

  useEffect(() => {
    if (!user) navigate("/auth/sign-in");
  }, [user]);

  useEffect(() => {
    if (!localStorage.getItem("clerk_active_org") || !isSignedIn) {
      localStorage.getItem("clerk_active_org");
      localStorage.removeItem("isFirstLoad");
    }
  }, [isSignedIn]);

  const AppButton = ({ icon, name, url }) => (
    <button
      className="flex flex-col items-center p-3 rounded-lg transition-all duration-200 hover:bg-blue-50 hover:scale-105"
      onClick={() => window.open(url, "_blank")}
    >
      <img src={icon} alt={name} className="h-6 w-6 mb-1" />
      <span className="text-xs font-medium text-gray-700">{name}</span>
    </button>
  );

  return (
    <>
      <Navbar
        color="white"
        className="fixed top-0 left-0 right-0 z-[1050] bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg"
        fullWidth
        blurred
      >
        <div className="flex flex-col-reverse justify-between gap-6 md:flex-row md:items-center px-4">
          <div className="flex items-center gap-16">
            {/* Enhanced Logo Section */}
            <Link
              to={`/${layout}`}
              className="flex items-center group relative overflow-hidden"
            >
              <div className="relative flex items-center">
                <img
                  src={BargainwaleIcon}
                  alt="Logo"
                  className="h-8 md:h-10 w-auto object-contain transition-all duration-300 
                           group-hover:transform group-hover:scale-105"
                />
                {/* Logo Shine Effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"
                />
              </div>
              {/* Optional: Add your company name next to logo */}
              <span
                className="ml-3 text-white font-semibold text-lg hidden md:block
                             transition-colors duration-300 group-hover:text-blue-200"
              >
                Bargainwale
              </span>
            </Link>

            {/* Enhanced Navigation Links */}
            <div className="hidden md:flex gap-8">
              <NavLink to="/docs" label="Documentation" />
              <NavLink to="/tutorial" label="Tutorial" />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 relative">
            <SignedIn>
              {/* Sync Button with Enhanced Animation */}
              <button
                onClick={handleSync}
                className="flex items-center gap-2 px-4 py-2 rounded-full 
                         bg-gradient-to-r from-white/10 to-white/20 hover:from-white/15 hover:to-white/25
                         transition-all duration-300 text-white backdrop-blur-sm
                         transform hover:scale-105 active:scale-95"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{`Sync ${lastSyncTime}m ago`}</span>
              </button>

              {/* Action Buttons */}
              <ActionButtons
                isFullscreen={isFullscreen}
                toggleFullScreen={toggleFullScreen}
                toggleAppMenu={toggleAppMenu}
                handleOpenOrgProfile={handleOpenOrgProfile}
                handleOpenOrgProf={handleOpenOrgProf}
              />

              {/* User Profile Button */}
              <div className="relative group">
                <UserProfileDropdown
                  user={user}
                  handleOnClick={handleOpenUserProfile}
                  signOut={signOut}
                />
                {/* <UserButton
                  signOutCallback={handleSignOut}
                  appearance={{
                    elements: {
                      avatarBox:
                        "hover:scale-105 transition-transform duration-200",
                    },
                  }}
                /> */}
              </div>

              {/* Enhanced Apps Menu */}
              {showAppMenu && (
                <AppsMenu onClose={() => setShowAppMenu(false)} />
              )}
            </SignedIn>
          </div>
        </div>
      </Navbar>

      {/* Dialogs and Modals */}
      <Dialog
        open={openOrgProfile}
        handler={handleOpenOrgProfile}
        className="bg-white rounded-xl shadow-xl max-w-2xl mx-auto"
      >
        <OrganizationProfile />
      </Dialog>

      <Dialog
        open={openOrgProf}
        handler={handleOpenOrgProf}
        className="bg-white rounded-xl shadow-xl max-w-2xl mx-auto"
      >
        <ManageOrganizationProfile setOpen={setOpenOrgProf} />
      </Dialog>

      <Dialog
        open={openUserProfile}
        handler={handleOpenUserProfile}
        className="bg-white rounded-xl shadow-xl max-w-2xl mx-auto"
      >
        <UserProfile />
      </Dialog>
    </>
  );
}

// New Component: Navigation Link
const NavLink = ({ to, label }) => (
  <Link
    to={to}
    className="relative group text-white text-sm font-medium hover:text-blue-200 
               transition-colors duration-200 py-2"
  >
    {label}
    <span
      className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 
                    transition-all duration-300 group-hover:w-full"
    />
  </Link>
);

// New Component: Action Buttons
const ActionButtons = ({
  isFullscreen,
  toggleFullScreen,
  toggleAppMenu,
  handleOpenOrgProfile,
  handleOpenOrgProf,
}) => {
  const buttons = [
    {
      icon: <ArrowsPointingOutIcon className="h-5 w-5" />,
      onClick: toggleFullScreen,
      tooltip: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
    },
    {
      icon: <Squares2X2Icon className="h-5 w-5" />,
      onClick: toggleAppMenu,
      tooltip: "Quick Access",
    },
    {
      icon: <BuildingOfficeIcon className="h-5 w-5" />,
      onClick: handleOpenOrgProfile,
      tooltip: "Organization Settings",
    },
    {
      icon: <BuildingIcon className="h-5 w-5" />,
      onClick: handleOpenOrgProf,
      tooltip: "Organization Profile",
    },
  ];

  return (
    <div className="flex gap-2">
      {buttons.map((btn, idx) => (
        <div key={idx} className="relative group">
          <IconButton
            variant="text"
            color="white"
            onClick={btn.onClick}
            className="hover:bg-white/10 transition-all duration-200 
                     transform hover:scale-105 active:scale-95"
          >
            {btn.icon}
          </IconButton>
          <span
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 
                         whitespace-nowrap bg-gray-900 text-white text-xs 
                         px-2 py-1 rounded opacity-0 group-hover:opacity-100 
                         transition-opacity duration-200 pointer-events-none"
          >
            {btn.tooltip}
          </span>
        </div>
      ))}
    </div>
  );
};

// New Component: Apps Menu
const AppsMenu = ({ onClose }) => {
  const apps = [
    { icon: WhatsappIcon, name: "WhatsApp", url: "https://web.whatsapp.com" },
    { icon: GmailIcon, name: "Gmail", url: "https://mail.google.com" },
    { icon: BitbucketIcon, name: "Bitbucket", url: "https://bitbucket.org" },
    { icon: EmailIcon, name: "Email", url: "https://mail.com" },
    { icon: GithubIcon, name: "GitHub", url: "https://github.com" },
    {
      icon: FirebaseIcon,
      name: "Firebase",
      url: "https://firebase.google.com",
    },
  ];

  return (
    <div
      className="absolute top-16 right-0 bg-white rounded-xl shadow-2xl w-80 p-4 
                    transform transition-all duration-300 ease-out animate-fadeIn"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quick Access</h3>
        <button className="text-blue-600 text-sm hover:underline">
          View all
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {apps.map((app, idx) => (
          <button
            key={idx}
            className="flex flex-col items-center p-3 rounded-lg 
                     transition-all duration-200 hover:bg-blue-50 
                     hover:scale-105 group"
            onClick={() => window.open(app.url, "_blank")}
          >
            <img
              src={app.icon}
              alt={app.name}
              className="h-6 w-6 mb-1 transition-transform 
                       duration-200 group-hover:scale-110"
            />
            <span
              className="text-xs font-medium text-gray-700 
                          group-hover:text-blue-600"
            >
              {app.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardNavbar;
