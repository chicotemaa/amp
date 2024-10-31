"use client";

import React, { createContext, useContext, useState } from "react";

interface FilterState {
  searchTerm: string;
  status: string[];
  type: string[];
  date: string[];
  sortBy: string;
}


interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    status: [],
    type: [],
    date: [],
    sortBy: "newest"
  });
  

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}