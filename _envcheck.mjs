import { PublicClientApplication } from '@azure/msal-node';
import { DataProtectionScope, PersistenceCachePlugin, PersistenceCreator } from '@azure/msal-node-extensions';
import os from 'os';
import path from 'path';

const AUTH = path.join(os.homedir(), '.powerapps-cli', 'cache', 'auth');
const TENANT = 'a1104cac-3f3e-4e9d-a251-a93724b1727b';
const ENV = '07da6342-8cc4-e81c-95fa-9ce24e7c2f46';

const persistence = await PersistenceCreator.createPersistence({
  cachePath: AUTH + '/msal_cache.json',
  dataProtectionScope: DataProtectionScope.CurrentUser,
  serviceName: 'power-apps',
  accountName: 'power-apps',
  usePlaintextFileOnLinux: false,
});

const pca = new PublicClientApplication({
  auth: { authority: `https://login.microsoftonline.com/${TENANT}`, clientId: '9cee029c-6210-4654-90bb-17e6e9d36617' },
  cache: { cachePlugin: new PersistenceCachePlugin(persistence) },
});

const accounts = await pca.getTokenCache().getAllAccounts();
console.log('Signed-in account(s):', accounts.map(a => a.username).join(', ') || '(none)');
if (!accounts.length) { console.log('No cached account'); process.exit(2); }

const res = await pca.acquireTokenSilent({ account: accounts[0], scopes: ['https://api.bap.microsoft.com/.default'] });
const url = `https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/environments/${ENV}?$expand=properties&api-version=2023-06-01`;
const r = await fetch(url, { headers: { Authorization: 'Bearer ' + res.accessToken } });
if (!r.ok) { console.log('HTTP', r.status, await r.text()); process.exit(3); }
const j = await r.json();
const p = j.properties || {};
console.log('Environment display name:', p.displayName);
console.log('Environment type      :', p.environmentSku || (p.environmentType && p.environmentType.type));
console.log('Description           :', p.description || '(none)');
