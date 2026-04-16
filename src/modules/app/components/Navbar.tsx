import useUser from "@modules/user/hooks/useUser";
import Button from "@modules/app/modules/ui/components/Button/Button";

export default function Navbar() {
  const { user, signOut } = useUser();

  return (
    <header className="w-full border-b border-gray-100 bg-white px-6 md:px-8">
      <div className="flex items-center justify-between h-14 max-w-[1200px] mx-auto">
        <div />

        <div className="flex items-center gap-x-3">
          {user && (
            <span className="text-sm text-gray-600 font-body-medium">
              {user.firstName} {user.lastName}
            </span>
          )}
          <Button size="xs" color="light" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
