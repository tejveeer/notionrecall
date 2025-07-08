import { useUser } from "../UserContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { selectedUser, users, handleUserSelect } = useUser();
  const navigate = useNavigate();

  return (
    <nav className="bg-blue-500/15 backdrop-blur-md border border-blue-400/25 rounded-2xl p-2 w-full max-w-2xl relative z-50">
      <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-4 items-center">
        {/* Logo */}
        <div
          className="text-2xl ml-2 font-extrabold text-yellow-200 tracking-wider"
          style={{ fontFamily: "serif" }}
        >
          NR
        </div>

        {/* User Selector */}
        <div className="relative group z-50">
          <button className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 hover:border-yellow-400/50 rounded-lg px-3 py-1 text-yellow-100 transition-all duration-200 font-medium cursor-pointer">
            {selectedUser}
          </button>

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 bg-blue-600/30 backdrop-blur-md border border-blue-500/30 rounded-lg shadow-lg min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
            {users.map((user) => (
              <button
                key={user.value}
                onClick={() => handleUserSelect(user.value)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg cursor-pointer ${
                  selectedUser === user.value
                    ? "bg-yellow-500/30 text-yellow-100"
                    : "text-blue-200 hover:bg-blue-500/20"
                }`}
              >
                {user.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div></div>

        {/* Search */}
        <button
          onClick={() => navigate("/")}
          className="bg-yellow-500/20 cursor-pointer hover:bg-yellow-500/30 border border-yellow-400/30 hover:border-yellow-400/50 rounded-lg px-3 py-1 text-yellow-100 font-medium transition-all duration-200"
        >
          Home
        </button>

        {/* History */}
        <button
          onClick={() => navigate("/history")}
          className="bg-yellow-500/20 mr-2 cursor-pointer hover:bg-yellow-500/30 border border-yellow-400/30 hover:border-yellow-400/50 rounded-lg px-3 py-1 text-yellow-100 font-medium transition-all duration-200"
        >
          History
        </button>
      </div>
    </nav>
  );
}
