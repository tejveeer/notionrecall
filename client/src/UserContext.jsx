import { createContext, useState, useContext } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [selectedUser, setSelectedUser] = useState("T");

  const users = [
    { value: "T", label: "Tejveer" },
    { value: "S", label: "Sehaj" },
  ];

  const handleUserSelect = (userValue) => {
    setSelectedUser(userValue);
  };

  return (
    <UserContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
        users,
        handleUserSelect,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
