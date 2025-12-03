import UserMenu from "./UserMenu";

const AppHeader = () => {
  return (
    <header className="fixed top-0 right-0 z-50 p-4">
      <UserMenu />
    </header>
  );
};

export default AppHeader;
