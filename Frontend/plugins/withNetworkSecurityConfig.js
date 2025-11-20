const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">13.51.172.220</domain>
        <domain includeSubdomains="true">192.168.1.34</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>`;

const withNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    
    // Add attributes to application tag
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    mainApplication.$['android:usesCleartextTraffic'] = 'true';

    // Write network security config file
    const androidPath = config.modRequest.platformProjectRoot;
    const resPath = path.join(androidPath, 'app', 'src', 'main', 'res');
    const xmlPath = path.join(resPath, 'xml');
    
    // Create directories if they don't exist
    if (!fs.existsSync(xmlPath)) {
      fs.mkdirSync(xmlPath, { recursive: true });
    }
    
    // Write the network security config file
    fs.writeFileSync(
      path.join(xmlPath, 'network_security_config.xml'),
      NETWORK_SECURITY_CONFIG
    );

    return config;
  });
};

module.exports = withNetworkSecurityConfig;
