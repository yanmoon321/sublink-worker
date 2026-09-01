import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

const SS_INPUT = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1';

async function buildConfig(selectedRules = 'balanced') {
  const builder = new ClashConfigBuilder(
    SS_INPUT,
    selectedRules,
    [],
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
      'https://1.1.1.1/dns-query#RULES',
      'https://8.8.8.8/dns-query#RULES'
    ]);
    expect(config.dns['proxy-server-nameserver']).toEqual([
      'https://223.5.5.5/dns-query',
      'https://1.12.12.12/dns-query'
    ]);
    expect(serialized).not.toContain('120.53.53.53');
  });
});
