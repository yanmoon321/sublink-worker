/**
 * Clash Configuration
 * Base configuration template for Clash client
 */

export const CLASH_CONFIG = {
	'port': 7890,
	'socks-port': 7891,
	'allow-lan': false,
	'mode': 'rule',
	'log-level': 'info',
	'ipv6': false,
	'tcp-concurrent': true,
	'unified-delay': true,
	'geodata-mode': true,
	'geo-auto-update': true,
	'geodata-loader': 'memconservative',
	'geosite-matcher': 'succinct',
	'geo-update-interval': 24,
	'global-ua': 'clash.meta',
	'etag-support': true,
	'geox-url': {
		'geoip': "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
		'geosite': "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
		'mmdb': "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb",
		'asn': "https://github.com/xishang0128/geoip/releases/download/latest/GeoLite2-ASN.mmdb"
	},
	'profile': {
		'store-selected': true,
		'store-fake-ip': true
	},
	'rule-providers': {
		// 将由代码自动生成
	},
	'dns': {
		'enable': true,
		'ipv6': false,
		'cache-algorithm': 'arc',
		'use-hosts': true,
		'use-system-hosts': false,
		'respect-rules': true,
		'enhanced-mode': 'fake-ip',
		'fake-ip-range': '198.18.0.1/16',
		'fake-ip-filter-mode': 'blacklist',
		'fake-ip-filter': [
			'*.lan',
			'*.local',
			'+.home.arpa',
			'localhost.ptlogin2.qq.com',
			'+.srv.nintendo.net',
			'+.stun.playstation.net',
			'+.msftconnecttest.com',
			'+.msftncsi.com',
			'+.xboxlive.com',
			'xbox.*.microsoft.com',
			'stun.*',
			'stun.*.*',
			'stun.*.*.*',
			'*.stun.*',
			'*.stun.*.*',
			'*.stun.*.*.*',
			'*.battlenet.com.cn',
			'*.battlenet.com',
			'*.blzstatic.cn',
			'*.battle.net'
		],
		'default-nameserver': [
			'223.5.5.5',
			'1.12.12.12'
		],
		'nameserver': [
			'https://1.1.1.1/dns-query',
			'https://8.8.8.8/dns-query'
		],
		'proxy-server-nameserver': [
			// Bootstrap only: these resolvers see node hostnames, never normal
			// browsing queries.  They must be reachable before a proxy exists.
			'https://223.5.5.5/dns-query',
			'https://1.12.12.12/dns-query'
		]
	},
	'proxies': [],
	'proxy-groups': []
};
