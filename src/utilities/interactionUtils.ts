import * as readline from 'readline';

/**
 * User Interaction Utilities
 * 
 * Provides CLI user interaction helpers for confirmations, prompts, and formatted output.
 * Handles readline interface management and input validation.
 * 
 * @example
 * ```typescript
 * const confirmed = await InteractionUtils.askYesNo('Continue?');
 * await InteractionUtils.confirmScriptGeneration(script);
 * ```
 */
export class InteractionUtils {
  
  /**
   * Display generated script and ask for user confirmation
   * 
   * @param {string} script - Generated podcast script to display
   * @returns {Promise<boolean>} True if user confirms, false otherwise
   * @example
   * ```typescript
   * const confirmed = await InteractionUtils.confirmScriptGeneration('Script text...');
   * if (confirmed) {
   *   // Proceed with synthesis
   * }
   * ```
   */
  static async confirmScriptGeneration(script: string): Promise<boolean> {
    // Display the generated script with nice formatting
    console.log('\n' + '='.repeat(80));
    console.log('📝 GENERATED PODCAST SCRIPT');
    console.log('='.repeat(80));
    console.log(script);
    console.log('='.repeat(80));
    console.log(`📊 Script length: ${script.length} characters`);
    console.log('='.repeat(80));
    
    // Ask for confirmation
    return await this.askYesNo('\n🎙️  Proceed with audio synthesis? (Y/n)');
  }

  /**
   * Ask a yes/no question and return boolean result
   * 
   * @param {string} question - Question to ask user
   * @returns {Promise<boolean>} True for yes, false for no (defaults to yes on Enter)
   * @example
   * ```typescript
   * const proceed = await InteractionUtils.askYesNo('Continue?');
   * ```
   */
  static async askYesNo(question: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question + ' ', (answer) => {
        rl.close();
        const normalizedAnswer = answer.toLowerCase().trim();
        
        // Default to yes if just Enter is pressed, or if 'y' or 'yes'
        const isYes = normalizedAnswer === '' || 
                     normalizedAnswer === 'y' || 
                     normalizedAnswer === 'yes';
        
        resolve(isYes);
      });
    });
  }

  /**
   * Display a cancellation message
   */
  static displayCancellation(): void {
    console.log('\n❌ Process cancelled by user.');
    console.log('💡 Tip: Use the -y flag to auto-approve scripts in the future.');
  }

  /**
   * Display auto-approval message
   */
  static displayAutoApproval(script: string): void {
    console.log('\n' + '='.repeat(80));
    console.log('📝 GENERATED PODCAST SCRIPT (AUTO-APPROVED)');
    console.log('='.repeat(80));
    console.log(script);
    console.log('='.repeat(80));
    console.log(`📊 Script length: ${script.length} characters`);
    console.log('🚀 Proceeding automatically with audio synthesis...');
    console.log('='.repeat(80));
  }
}