import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";
import AudioMuteButton from "./AudioMuteButton";

const AppHeader = () => {
  return (
    <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-2">
      <AudioMuteButton />
      <NotificationBell />
      <UserMenu />
    </header>
  );
};

export default AppHeader;
