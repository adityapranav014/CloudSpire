import { createContext, useContext, useState } from "react";

const initialState = {
  provider: "all",
  setProvider: () => null,
  dateRange: "30d",
  setDateRange: () => null,
};

const FilterContext = createContext(initialState);

export function FilterProvider({ children }) {
  const [provider, setProvider] = useState("all");
  const [dateRange, setDateRange] = useState("30d");

  return (
    <FilterContext.Provider
      value={{
        provider,
        setProvider,
        dateRange,
        setDateRange,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useGlobalFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useGlobalFilters must be used within a FilterProvider");
  }
  return context;
}