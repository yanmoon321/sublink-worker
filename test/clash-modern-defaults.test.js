import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

const SS_INPUT = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1';

async function buildConfig(selectedRules = 'balanced', customRules = []) {
  const builder = new ClashConfigBuilder(
    SS_INPUT,
    selectedRules,
    customRules,
    null,
    'zh-CN',
    'ClashMetaForAndroid/2.11.33'
  );
  return yaml.load(await builder.build());
}

describe('modern Clash/mihomo defaults', () => {
  it('uses maintained Loyalsoldier baseline providers', async () => {
    const config = await buildConfig();
    const providers = config['rule-providers'];

    expect(providers['loyalsoldier-proxy']).toMatchObject({
      behavior: 'domain',
      format: 'yaml',
      interval: 86400
    });
    expect(providers['loyalsoldier-proxy'].url)
      .toBe('https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt');
    expect(providers['loyalsoldier-direct'].url).toContain('/direct.txt');
    expect(providers['loyalsoldier-cncidr'].behavior).toBe('ipcidr');
    expect(providers['loyalsoldier-applications'].behavior).toBe('classical');
    expect(providers['loyalsoldier-reject']).toBeUndefined();
  });

  it('enables the broad reject list only when Ad Block is selected', async () => {
    const withoutAdBlock = await buildConfig('balanced');
    const withAdBlock = await buildConfig(['Ad Block', 'Private', 'Non-China', 'Location:CN']);

    expect(withoutAdBlock['rule-providers']['loyalsoldier-reject']).toBeUndefined();
    expect(withoutAdBlock.rules).not.toContain('RULE-SET,loyalsoldier-reject,REJECT');
    expect(withAdBlock['rule-providers']['loyalsoldier-reject']).toBeDefined();
    expect(withAdBlock.rules).toContain('RULE-SET,loyalsoldier-reject,REJECT');
  });

  it('places custom exceptions before baseline guards and optional rejection', async () => {
    const config = await buildConfig(
      ['Ad Block', 'Private', 'Non-China', 'Location:CN'],
      [{ name: 'Allow Sync', domain_suffix: 'passbox-pa.googleapis.com' }]
    );
    const rules = config.rules;
    const customIndex = rules.findIndex(rule => rule.startsWith('DOMAIN-SUFFIX,passbox-pa.googleapis.com,'));
    const applicationsIndex = rules.indexOf('RULE-SET,loyalsoldier-applications,DIRECT');
    const privateIndex = rules.indexOf('RULE-SET,loyalsoldier-private,DIRECT');
    const rejectIndex = rules.indexOf('RULE-SET,loyalsoldier-reject,REJECT');

    expect(customIndex).toBe(0);
    expect(customIndex).toBeLessThan(applicationsIndex);
    expect(applicationsIndex).toBeLessThan(privateIndex);
    expect(privateIndex).toBeLessThan(rejectIndex);
  });

  it('places explicit proxy rules before direct and broad China rules', async () => {
    const config = await buildConfig('minimal');
    const rules = config.rules;
    const indexOf = prefix => rules.findIndex(rule => rule.startsWith(prefix));

    const proxyIndex = indexOf('RULE-SET,loyalsoldier-proxy,');
    const directIndex = indexOf('RULE-SET,loyalsoldier-direct,');
    const nonChinaIndex = indexOf('RULE-SET,geolocation-!cn,');
    const chinaIndex = indexOf('RULE-SET,cn,');

    expect(proxyIndex).toBeGreaterThan(-1);
    expect(proxyIndex).toBeLessThan(directIndex);
    expect(directIndex).toBeLessThan(nonChinaIndex);
    expect(nonChinaIndex).toBeLessThan(chinaIndex);
    expect(rules.at(-1)).toMatch(/^MATCH,/);
  });

  it('ships automatic Geo data and privacy-oriented fake-IP DNS defaults', async () => {
    const config = await buildConfig();
    const serialized = JSON.stringify(config);

    expect(config['geodata-mode']).toBe(true);
    expect(config['geodata-loader']).toBe('memconservative');
    expect(config['geo-auto-update']).toBe(true);
    expect(config['geox-url']).toEqual(expect.objectContaining({
      geoip: expect.stringContaining('MetaCubeX/meta-rules-dat@release/geoip.dat'),
      geosite: expect.stringContaining('MetaCubeX/meta-rules-dat@release/geosite.dat'),
      mmdb: expect.stringContaining('MetaCubeX/meta-rules-dat@release/country.mmdb'),
      asn: expect.stringContaining('GeoLite2-ASN.mmdb')
    }));

    expect(config.ipv6).toBe(false);
    expect(config.dns.ipv6).toBe(false);
    expect(config.dns['enhanced-mode']).toBe('fake-ip');
    expect(config.dns.nameserver).toEqual([
      'https://1.1.1.1/dns-query',
      'https://8.8.8.8/dns-query'
    ]);
    expect(config.dns['proxy-server-nameserver']).toEqual([
      'https://223.5.5.5/dns-query',
      'https://1.12.12.12/dns-query'
    ]);
    expect(config.dns['fake-ip-filter']).toEqual(expect.arrayContaining([
      '+.home.arpa',
      '+.stun.playstation.net',
      '+.msftconnecttest.com',
      '+.xboxlive.com',
      '*.battle.net'
    ]));
    expect(serialized).not.toContain('120.53.53.53');
  });
});
