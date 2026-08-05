import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { emailService } from '../src/common/services/email.service';

async function main() {
  console.log('Testing sendPasswordResetEmail...');
  try {
    await emailService.sendPasswordResetEmail('jumijkkalita@gmail.com', '654321', 'Jumij Kalita');
    console.log('Done calling sendPasswordResetEmail');
  } catch (err) {
    console.error('Error in sendPasswordResetEmail:', err);
  }
}

main();
