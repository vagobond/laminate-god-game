import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";

const AppHeader = () => {
  return (
    <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-2">
      <NotificationBell />
      <UserMenu />
    </header>
  );
};

export default AppHeader;
