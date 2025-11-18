/**
 * Unified Validation Framework - Extends LocationValidator pattern
 * 
 * CORE PRINCIPLES APPLIED:
 * - ENHANCEMENT FIRST: Consolidates existing validations from multiple services
 * - AGGRESSIVE CONSOLIDATION: Single source of truth for all validation logic
 * - DRY: Eliminates duplicated validation patterns across services
 * - CLEAN: Clear separation of validation concerns by domain
 * - MODULAR: Composable validators that can be mixed and matched
 * - PERFORMANT: Efficient validation with early returns and caching
 */

// Import all validators
import { LocationValidator } from '../locationValidator.js';
import { TradingValidator } from './tradingValidator.js';
import { MarketDataValidator } from './marketDataValidator.js';
import { WeatherDataValidator } from './weatherDataValidator.js';
import { APIInputValidator } from './apiInputValidator.js';
import { FuturesBetValidator } from './futuresBetValidator.js';

// Re-export for convenience
export { LocationValidator, TradingValidator, MarketDataValidator, WeatherDataValidator, APIInputValidator, FuturesBetValidator };

/**
 * Master validation orchestrator
 * Routes validation requests to appropriate domain validators
 */
export class ValidationOrchestrator {
  
  /**
   * Validate any input based on validation type and context
   * @param {string} validationType - The type of validation needed
   * @param {any} input - The data to validate
   * @param {object} context - Additional context for validation
   * @returns {object} { valid: boolean, errors: string[], warnings: string[], category: string }
   */
  static validate(validationType, input, context = {}) {
    const validators = {
      'location': LocationValidator.validateLocation,
      'trading': TradingValidator.validateTradingOperation,
      'market-data': MarketDataValidator.validateMarketData,
      'weather-data': WeatherDataValidator.validateWeatherData,
      'api-input': APIInputValidator.validateAPIInput,
      'futures-bet': FuturesBetValidator.validateMarketType
    };
    
    const validator = validators[validationType];
    if (!validator) {
      return {
        valid: false,
        errors: [`Unknown validation type: ${validationType}`],
        warnings: [],
        category: 'unknown'
      };
    }
    
    try {
      return validator(input, context);
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        category: validationType,
        error: error
      };
    }
  }
  
  /**
   * Validate multiple items with different validators
   * @param {Array} validationRequests - Array of {type, input, context} objects
   * @returns {object} Combined validation result
   */
  static validateMultiple(validationRequests) {
    const results = validationRequests.map(req => ({
      ...req,
      result: this.validate(req.type, req.input, req.context)
    }));
    
    const allValid = results.every(r => r.result.valid);
    const errors = results.flatMap(r => r.result.errors || []);
    const warnings = results.flatMap(r => r.result.warnings || []);
    
    return {
      valid: allValid,
      errors,
      warnings,
      results: results.map(r => ({
        type: r.type,
        valid: r.result.valid,
        errors: r.result.errors,
        warnings: r.result.warnings
      }))
    };
  }
  
  /**
   * Get available validators and their capabilities
   */
  static getValidatorInfo() {
    return {
      'location': 'Validates location appropriateness for market types (sports, weather, politics, etc.)',
      'trading': 'Validates trading operations, orders, wallet status, and market conditions',
      'market-data': 'Validates market data integrity, pricing, and metadata consistency',
      'weather-data': 'Validates weather data completeness, accuracy, and source reliability',
      'api-input': 'Validates API inputs, parameters, and request format',
      'futures-bet': 'Validates and classifies market types (single events vs futures)'
    };
  }
}