#!/usr/bin/env node

/**
 * Swagger Documentation Template Generator
 *
 * Usage: node scripts/generate-swagger-template.js
 *
 * This script helps you quickly generate Swagger JSDoc templates
 * for your API endpoints.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function generateTemplate() {
  console.log('\n🚀 Swagger Documentation Template Generator\n');

  const path = await question('Endpoint path (e.g., /users/{id}): ');
  const method = await question('HTTP method (get/post/patch/delete): ');
  const summary = await question('Brief description: ');
  const tag = await question('Tag name (e.g., Users): ');
  const requiresAuth = await question('Requires authentication? (y/n): ');
  const hasBody = await question('Has request body? (y/n): ');
  const hasParams = await question('Has path/query parameters? (y/n): ');

  console.log('\n📋 Generated Swagger Documentation:\n');
  console.log('```typescript');
  console.log('/**');
  console.log(` * @swagger`);
  console.log(` * ${path}:`);
  console.log(` *   ${method}:`);
  console.log(` *     summary: ${summary}`);
  console.log(` *     tags: [${tag}]`);

  if (requiresAuth.toLowerCase() === 'y') {
    console.log(` *     security:`);
    console.log(` *       - cookieAuth: []`);
  }

  if (hasParams.toLowerCase() === 'y') {
    console.log(` *     parameters:`);
    console.log(` *       - in: path|query`);
    console.log(` *         name: paramName`);
    console.log(` *         required: true`);
    console.log(` *         schema:`);
    console.log(` *           type: string`);
    console.log(` *         description: Parameter description`);
  }

  if (hasBody.toLowerCase() === 'y') {
    console.log(` *     requestBody:`);
    console.log(` *       required: true`);
    console.log(` *       content:`);
    console.log(` *         application/json:`);
    console.log(` *           schema:`);
    console.log(` *             type: object`);
    console.log(` *             required:`);
    console.log(` *               - field1`);
    console.log(` *             properties:`);
    console.log(` *               field1:`);
    console.log(` *                 type: string`);
    console.log(` *                 example: "example value"`);
  }

  console.log(` *     responses:`);
  console.log(` *       200:`);
  console.log(` *         description: Success`);
  console.log(` *         content:`);
  console.log(` *           application/json:`);
  console.log(` *             schema:`);
  console.log(` *               $ref: '#/components/schemas/Success'`);

  if (requiresAuth.toLowerCase() === 'y') {
    console.log(` *       401:`);
    console.log(` *         description: Unauthorized`);
    console.log(` *         content:`);
    console.log(` *           application/json:`);
    console.log(` *             schema:`);
    console.log(` *               $ref: '#/components/schemas/Error'`);
  }

  console.log(` *       400:`);
  console.log(` *         description: Bad request`);
  console.log(` *         content:`);
  console.log(` *           application/json:`);
  console.log(` *             schema:`);
  console.log(` *               $ref: '#/components/schemas/Error'`);
  console.log(` */`);
  console.log(`router.${method}('${path}', controller.method);`);
  console.log('```\n');

  rl.close();
}

generateTemplate().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
