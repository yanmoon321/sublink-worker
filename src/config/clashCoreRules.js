/**
 * Stable baseline routing for Clash/mihomo.
 *
 * The service-specific rule sets generated from MetaCubeX remain useful for
 * user-selectable groups.  These providers add a conservative whitelist-mode
 * baseline from Loyalsoldier so that an overseas domain accidentally included
 * in a broad China list is not sent DIRECT.
 */

const LOYALSOLDIER_BASE_URL = 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/';

const PROVIDERS = {
	'loyalsoldier-reject': { file: 'reject.txt', behavior: 'domain' },
	'loyalsoldier-private': { file: 'private.txt', behavior: 'domain' },
	'loyalsoldier-applications': { file: 'applications.txt', behavior: 'classical' },
	'loyalsoldier-proxy': { file: 'proxy.txt', behavior: 'domain' },
	'loyalsoldier-direct': { file: 'direct.txt', behavior: 'domain' },
	'loyalsoldier-lancidr': { file: 'lancidr.txt', behavior: 'ipcidr' },
	'loyalsoldier-telegramcidr': { file: 'telegramcidr.txt', behavior: 'ipcidr' },
	'loyalsoldier-cncidr': { file: 'cncidr.txt', behavior: 'ipcidr' }
};

export const BROAD_FALLBACK_RULE_PROVIDERS = new Set([
	'private-ip',
	'geolocation-!cn',
	'geolocation-cn',
	'cn',
	'cn-ip'
]);

export function generateLoyalsoldierClashRuleProviders({ includeReject = false } = {}) {
	return Object.fromEntries(Object.entries(PROVIDERS)
		.filter(([name]) => includeReject || name !== 'loyalsoldier-reject')
		.map(([name, definition]) => [name, {
		type: 'http',
		behavior: definition.behavior,
		format: 'yaml',
		url: `${LOYALSOLDIER_BASE_URL}${definition.file}`,
		path: `./ruleset/${name}.yaml`,
		interval: 86400
	}]));
}

export function generateLoyalsoldierClashRules(translator, { includeReject = false } = {}) {
	const nonChina = translator('outboundNames.Non-China');
	const china = translator('outboundNames.Location:CN');

	return {
		guardRules: [
			'RULE-SET,loyalsoldier-applications,DIRECT',
			'RULE-SET,loyalsoldier-private,DIRECT',
			...(includeReject ? ['RULE-SET,loyalsoldier-reject,REJECT'] : [])
		],
		routingRules: [
			// Proxy must precede direct: the upstream lists can overlap.
			`RULE-SET,loyalsoldier-proxy,${nonChina}`,
			`RULE-SET,loyalsoldier-direct,${china}`,
			'RULE-SET,loyalsoldier-lancidr,DIRECT,no-resolve',
			`RULE-SET,loyalsoldier-telegramcidr,${nonChina},no-resolve`,
			`RULE-SET,loyalsoldier-cncidr,${china},no-resolve`
		]
	};
}

export function isBroadFallbackRule(ruleLine) {
	if (typeof ruleLine !== 'string' || !ruleLine.startsWith('RULE-SET,')) {
		return false;
	}
	const providerName = ruleLine.split(',', 3)[1];
	return BROAD_FALLBACK_RULE_PROVIDERS.has(providerName);
}
