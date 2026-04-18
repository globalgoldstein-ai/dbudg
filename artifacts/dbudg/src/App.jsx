// D-Budg | Session 3 | Build 1 | 2026-04-18 | To Last 10 Years tile

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const SEED_DMV = {
  rent: 2100, hoa: 0, insurance: 30, utilities: 200, uber: 200,
  medication: 200, housekeeper: 200, cable: 75, mobile: 50,
  cigarettes: 280, groceries: 800, personal: 400,
};

const SEED_MS = {
  rent: 632, hoa: 0, insurance: 300, utilities: 300, uber: 50,
  medication: 100, housekeeper: 200, cable: 238, mobile: 150,
  cigarettes: 280, groceries: 1300, personal: 1000,
};

const DMV_LABELS = {
  rent: "Rent", hoa: "HOA", insurance: "Home / Renters Insurance",
  utilities: "Utilities", uber: "Uber / Transit", medication: "Medication",
  housekeeper: "Housekeeper", cable: "Cable / Internet", mobile: "Mobile Phone",
  cigarettes: "Cigarettes", groceries: "Groceries", personal: "Skin Care, Hair & Clothing",
};

const SEED_HOUSE = {
  salePrice: 250000, mortgagePayoff: 55000, transactionCostPct: 8,
  repairs: 0, moving: 10000, condoPrice: 300000, downPayment: 100000,
  capGainsRate: 15, rentInstead: true,
  fidelityBalance: 75883, fidelityDate: "April 2026",
};

const SEED_INCOME = { socialSecurity: 1900 };
const SEED_PROJ   = { strategy: "moneyMarket", returnPct: 2.5, inflationPct: 2.5, man​​​​​​​​​​​​​​​​
