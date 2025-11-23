import fetch from 'node-fetch';

const BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export const kalshiService = {
    /**
     * Fetch markets for a specific series (e.g., KXHIGHNY for NYC Temp)
     */
    async getSeriesMarkets(seriesTicker) {
        try {
            const response = await fetch(`${BASE_URL}/markets?series_ticker=${seriesTicker}&status=open`);
            const data = await response.json();
            return data.markets || [];
        } catch (error) {
            console.error(`Failed to fetch Kalshi markets for series ${seriesTicker}:`, error);
            return [];
        }
    },

    /**
     * Fetch specific event details
     */
    async getEvent(eventTicker) {
        try {
            const response = await fetch(`${BASE_URL}/events/${eventTicker}`);
            const data = await response.json();
            return data.event;
        } catch (error) {
            console.error(`Failed to fetch Kalshi event ${eventTicker}:`, error);
            return null;
        }
    },

    /**
     * Fetch orderbook for a market
     */
    async getOrderbook(marketTicker) {
        try {
            const response = await fetch(`${BASE_URL}/markets/${marketTicker}/orderbook`);
            const data = await response.json();
            return data.orderbook;
        } catch (error) {
            console.error(`Failed to fetch orderbook for ${marketTicker}:`, error);
            return null;
        }
    },

    /**
     * Search/Discovery for Weather Markets
     * Note: Kalshi doesn't have a simple "search" endpoint in the snippet, 
     * so we might need to know specific series tickers or crawl events.
     * Common Weather Series:
     * - KXHIGHNY (NYC High Temp)
     * - KXHIGHCHI (Chicago High Temp)
     * - KXHIGHMIA (Miami High Temp)
     * - KXHIGHAUS (Austin High Temp)
     */
    async getWeatherMarkets() {
        const weatherSeries = ['KXHIGHNY', 'KXHIGHCHI', 'KXHIGHMIA', 'KXHIGHAUS'];
        const allMarkets = [];

        for (const ticker of weatherSeries) {
            const markets = await this.getSeriesMarkets(ticker);
            allMarkets.push(...markets);
        }

        return allMarkets.map(m => ({
            id: m.ticker,
            platform: 'kalshi',
            title: m.title,
            ticker: m.ticker,
            eventTicker: m.event_ticker,
            yesPrice: m.yes_price,
            noPrice: m.no_price, // Derived or fetched? Kalshi usually gives yes_price. No price is 100 - yes.
            volume: m.volume,
            openDate: m.open_date,
            closeDate: m.close_date,
            // Normalize to our app's format
            marketID: m.ticker,
            currentOdds: {
                yes: m.yes_price / 100,
                no: (100 - m.yes_price) / 100
            },
            liquidity: m.liquidity || 0, // Might need to derive from orderbook
            resolutionDate: m.close_date
        }));
    }
};
