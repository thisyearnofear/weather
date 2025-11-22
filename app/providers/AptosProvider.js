'use client';

import React from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';

/**
 * Aptos Wallet Provider
 * 
 * Supports multiple wallets:
 * - Petra (most popular)
 * - Martian
 * - Pontem
 * 
 * Users can choose their preferred wallet
 */
export function AptosProvider({ children }) {
    const wallets = [
        new PetraWallet(),
        new MartianWallet(),
        new PontemWallet(),
    ];

    return (
        <AptosWalletAdapterProvider
            plugins={wallets}
            autoConnect={true}
            onError={(error) => {
                console.error('Aptos wallet error:', error);
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
}
