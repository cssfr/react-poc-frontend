/**
 * Futures symbol mapping utilities
 * Converts contract-specific symbols to base symbols for API calls
 */

/**
 * Map of contract symbols to API symbols and descriptions
 * Maps both micro futures and standard futures to the correct API symbols
 */
const FUTURES_SYMBOL_MAPPING: Record<string, { apiSymbol: string; name: string; description: string }> = {
  // Micro futures -> map to standard API symbols
  'MYM': { apiSymbol: 'DJIA', name: 'Micro Dow Jones', description: 'Micro E-mini Dow Jones Industrial Average' },
  'MNQ': { apiSymbol: 'NQ', name: 'Micro Nasdaq', description: 'Micro E-mini Nasdaq-100' },
  'MES': { apiSymbol: 'ES', name: 'Micro S&P', description: 'Micro E-mini S&P 500' },
  'M2K': { apiSymbol: 'RUT', name: 'Micro Russell', description: 'Micro E-mini Russell 2000' },
  
  // Standard E-mini futures -> map to API symbols
  'YM': { apiSymbol: 'DJIA', name: 'E-mini Dow', description: 'E-mini Dow Jones Industrial Average' },
  'NQ': { apiSymbol: 'NQ', name: 'E-mini Nasdaq', description: 'E-mini Nasdaq-100' },
  'ES': { apiSymbol: 'ES', name: 'E-mini S&P', description: 'E-mini S&P 500' },
  'RTY': { apiSymbol: 'RUT', name: 'E-mini Russell', description: 'E-mini Russell 2000' },
  
  // Other common futures -> map to API symbols  
  'CL': { apiSymbol: 'CL', name: 'Crude Oil', description: 'Light Sweet Crude Oil' },
  'GC': { apiSymbol: 'GOLD', name: 'Gold', description: 'Gold Futures' },
  'SI': { apiSymbol: 'SI', name: 'Silver', description: 'Silver Futures' },
  'ZB': { apiSymbol: 'ZB', name: '30-Year Bond', description: '30-Year U.S. Treasury Bond' },
  'ZN': { apiSymbol: 'ZN', name: '10-Year Note', description: '10-Year U.S. Treasury Note' },
  'ZF': { apiSymbol: 'ZF', name: '5-Year Note', description: '5-Year U.S. Treasury Note' },
  
  // Direct API symbols (fallback)
  'DJIA': { apiSymbol: 'DJIA', name: 'Dow Jones Industrial Average', description: 'Dow Jones Industrial Average' },
  'RUT': { apiSymbol: 'RUT', name: 'Russell 2000 Index', description: 'Russell 2000 Index' },
  'GOLD': { apiSymbol: 'GOLD', name: 'Gold Futures', description: 'Gold Futures' },
  'BTC': { apiSymbol: 'BTC', name: 'Bitcoin Futures', description: 'Bitcoin Futures' },
  'VIX': { apiSymbol: 'VIX', name: 'Volatility Index', description: 'Volatility Index' },
};

/**
 * Futures contract month codes
 */
const MONTH_CODES = {
  'F': 'January',
  'G': 'February', 
  'H': 'March',
  'J': 'April',
  'K': 'May',
  'M': 'June',
  'N': 'July',
  'Q': 'August',
  'U': 'September',
  'V': 'October',
  'X': 'November',
  'Z': 'December'
} as const;

/**
 * Extract base symbol from futures contract symbol and map to API symbol
 * Examples: 
 * - MYMU5 -> MYM -> DJIA (for API)
 * - MNQU5 -> MNQ -> NQ (for API)
 * - M2KU5 -> M2K -> RUT (for API)
 * - MESU5 -> MES -> ES (for API)
 */
export function extractBaseSymbol(contractSymbol: string): string {
  if (!contractSymbol) return '';
  
  // Remove common futures contract suffixes (month + year codes)
  // Pattern: [BASE_SYMBOL][MONTH_CODE][YEAR_DIGIT(S)]
  const contractPattern = /^([A-Z0-9]+)([FGHJKMNQUVXZ])(\d+)$/;
  const match = contractSymbol.match(contractPattern);
  
  if (match) {
    const baseSymbol = match[1];
    // Map to API symbol if available
    const mapping = FUTURES_SYMBOL_MAPPING[baseSymbol];
    if (mapping) {
      console.log(`🔄 Mapped contract "${contractSymbol}" -> base "${baseSymbol}" -> API "${mapping.apiSymbol}"`);
      return mapping.apiSymbol;
    } else {
      console.log(`⚠️ No API mapping found for base symbol "${baseSymbol}", using as-is`);
      return baseSymbol;
    }
  }
  
  // If no pattern match, check if it's already a known symbol
  const directMapping = FUTURES_SYMBOL_MAPPING[contractSymbol];
  if (directMapping) {
    console.log(`🔄 Direct mapping "${contractSymbol}" -> API "${directMapping.apiSymbol}"`);
    return directMapping.apiSymbol;
  }
  
  console.log(`⚠️ No contract pattern found in "${contractSymbol}", using as-is`);
  return contractSymbol;
}

/**
 * Parse contract symbol details
 */
export function parseContractSymbol(contractSymbol: string): {
  baseSymbol: string;
  monthCode?: string;
  monthName?: string;
  year?: string;
  fullYear?: number;
  description?: string;
} {
  const contractPattern = /^([A-Z0-9]+)([FGHJKMNQUVXZ])(\d+)$/;
  const match = contractSymbol.match(contractPattern);
  
  if (!match) {
    return {
      baseSymbol: contractSymbol,
      description: FUTURES_SYMBOL_MAPPING[contractSymbol]?.description
    };
  }
  
  const [, baseSymbol, monthCode, yearDigits] = match;
  const monthName = MONTH_CODES[monthCode as keyof typeof MONTH_CODES];
  
  // Convert year digits to full year (assume 20XX for single digit, 20XX for double digit)
  let fullYear: number;
  if (yearDigits.length === 1) {
    fullYear = 2020 + parseInt(yearDigits);
  } else {
    fullYear = 2000 + parseInt(yearDigits);
  }
  
  return {
    baseSymbol,
    monthCode,
    monthName,
    year: yearDigits,
    fullYear,
    description: FUTURES_SYMBOL_MAPPING[baseSymbol]?.description
  };
}

/**
 * Get display name for symbol (includes contract details if available)
 */
export function getSymbolDisplayName(contractSymbol: string): string {
  const parsed = parseContractSymbol(contractSymbol);
  
  if (parsed.monthName && parsed.fullYear) {
    const baseName = FUTURES_SYMBOL_MAPPING[parsed.baseSymbol]?.name || parsed.baseSymbol;
    return `${baseName} ${parsed.monthName} ${parsed.fullYear}`;
  }
  
  return FUTURES_SYMBOL_MAPPING[parsed.baseSymbol]?.name || contractSymbol;
}

/**
 * Check if symbol is a recognized futures contract
 */
export function isFuturesContract(symbol: string): boolean {
  const parsed = parseContractSymbol(symbol);
  return parsed.baseSymbol in FUTURES_SYMBOL_MAPPING;
}

/**
 * Get all available API symbols
 */
export function getAvailableAPISymbols(): string[] {
  return Array.from(new Set(Object.values(FUTURES_SYMBOL_MAPPING).map(mapping => mapping.apiSymbol)));
}

/**
 * Get all available base symbols (contract symbols)
 */
export function getAvailableBaseSymbols(): string[] {
  return Object.keys(FUTURES_SYMBOL_MAPPING);
}

/**
 * Get API symbol for a given contract/base symbol
 */
export function getAPISymbolForContract(contractOrBaseSymbol: string): string | null {
  const mapping = FUTURES_SYMBOL_MAPPING[contractOrBaseSymbol];
  return mapping ? mapping.apiSymbol : null;
}

/**
 * Debug function to show all mappings
 */
export function debugSymbolMappings(): void {
  console.log('📊 Symbol Mappings:');
  Object.entries(FUTURES_SYMBOL_MAPPING).forEach(([contract, mapping]) => {
    console.log(`  ${contract} -> ${mapping.apiSymbol} (${mapping.name})`);
  });
} 