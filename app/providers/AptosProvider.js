'use client';

import React from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';

/**
 * Aptos Wallet Provider
 * 
 * Supports all standard-compliant wallets (Petra, Martian, Pontem, etc.)
 * automatically via the Wallet Standard.
 */
export function AptosProvider({ children }) {
    return (
        <AptosWalletAdapterProvider
            autoConnect={true}
            onError={(error) => {
                console.error('Aptos wallet error:', error);
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
}
