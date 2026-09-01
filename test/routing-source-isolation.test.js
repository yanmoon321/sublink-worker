import { describe, expect, it } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import {
  CLASH_IP_RULE_SET_BASE_URL,
  CLASH_SITE_RULE_SET_BASE_URL,
  IP_RULE_SET_BASE_URL,
  SITE_RULE_SET_BASE_URL,
  SURGE_IP_RULE_SET_BASEURL,
  SURGE_SITE_RULE_SET_BASEURL
} from '../src/config/ruleUrls.js';

const SS_INPUT = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1';

describe('routing source isolation', () => {
  it('uses direct maintained CDN sources without a gh-proxy intermediary', () => {
    const urls = [
      CLASH_IP_RULE_SET_BASE_URL,
      CLASH_SITE_RULE_SET_BASE_URL,
      IP_RULE_SET_BASE_URL,
      SITE_RULE_SET_BASE_URL,
      SURGE_IP_RULE_SET_BASEURL,
      SURGE_SITE_RULE_SET_BASEURL
    ];

    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/testingcf\.jsdelivr\.net\//);
      expect(url).not.toContain('gh-proxy.com');
    }
  });

  it('keeps the shared non-China rule before broad China rules in sing-box', async () => {
    const builder = new SingboxConfigBuilder(
      SS_INPUT,
      'minimal',
      [],
      null,
      'zh-CN',
      'SFA/1.14.0 (sing-box 1.14.0)'
    );
    await builder.build();

    const routeRules = builder.config.route.rules;
    const nonChinaIndex = routeRules.findIndex(rule => rule.rule_set?.includes('geolocation-!cn'));
    const chinaIndex = routeRules.findIndex(rule => rule.rule_set?.includes('cn'));

    expect(nonChinaIndex).toBeGreaterThan(-1);
    expect(chinaIndex).toBeGreaterThan(-1);
    expect(nonChinaIndex).toBeLessThan(chinaIndex);
    expect(JSON.stringify(builder.config)).not.toContain('loyalsoldier');
  });

  it('keeps Clash-only Loyalsoldier rules out of Surge output', async () => {
    const builder = new SurgeConfigBuilder(SS_INPUT, 'minimal', [], null, 'zh-CN', 'test-agent');
    const output = await builder.build();

    const nonChinaIndex = output.indexOf('/geolocation-!cn.conf');
    const chinaIndex = output.indexOf('/cn.conf');

    expect(nonChinaIndex).toBeGreaterThan(-1);
    expect(chinaIndex).toBeGreaterThan(-1);
    expect(nonChinaIndex).toBeLessThan(chinaIndex);
    expect(output).not.toContain('loyalsoldier');
  });
});
