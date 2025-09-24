# TURN Server Configuration Guide

## Overview
This guide explains how to configure your WebRTC application to use the TURN server for better connectivity, especially for users behind NATs and firewalls.

## TURN Server Configuration

Based on your provided configuration, your TURN server is set up with:

- **External IP**: 102.220.22.136
- **Local IP**: 192.168.0.152
- **Listening Port**: 3478 (UDP/TCP)
- **TLS Listening Port**: 5349
- **Port Range**: 49152-65535
- **Realm**: kesmis.go.ke

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# TURN Server Configuration
VITE_TURN_USERNAME=admin
VITE_TURN_CREDENTIAL=admin

# STUN Server Configuration (optional, defaults provided)
VITE_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# Video Streaming WebSocket URL
VITE_VIDEO_STREAM_WS_URL=ws://kesmis.go.ke:3000/video-stream
```

## Security Considerations

⚠️ **Important**: The current configuration uses hardcoded credentials. For production:

1. **Generate secure credentials**:
   ```bash
   # Generate a secure username and password
   turnadmin -a -u kesmis -p $(openssl rand -base64 32) -r kesmis.go.ke
   ```

2. **Use environment variables** for all credentials
3. **Rotate credentials** regularly
4. **Use TLS** for TURN server connections in production

## TURN Server Setup Commands

To set up your TURN server with the provided configuration:

```bash
# Install coturn
sudo apt-get update
sudo apt-get install coturn

# Create turnserver configuration file
sudo nano /etc/turnserver.conf
```

Add the following configuration to `/etc/turnserver.conf`:

```conf
# Basic TURN server ports
listening-port=3478
tls-listening-port=5349

# External IP mapping: public-ip/local-ip
external-ip=102.220.22.136/192.168.0.152

# Port range for media relay
min-port=49152
max-port=65535

# Enable verbose logging
verbose

# Use fingerprint for DTLS
fingerprint

# Use long-term credential mechanism
lt-cred-mech

# Realm
realm=kesmis.go.ke

# Server name
server-name=kesmis.go.ke

# Database for user management
userdb=/var/lib/turn/turndb

# Security settings
no-multicast-peers
no-loopback-peers
no-tcp-relay

# Log file
log-file=/var/log/turnserver.log

# Process user
proc-user=turnserver 
proc-group=turnserver
```

## User Management

To add users to your TURN server:

```bash
# Add a user
sudo turnadmin -a -u admin -p admin -r kesmis.go.ke

# List users
sudo turnadmin -l

# Delete a user
sudo turnadmin -d -u admin -r kesmis.go.ke
```

## Testing TURN Server

Test your TURN server configuration:

```bash
# Test with turnutils_stunclient
turnutils_stunclient kesmis.go.ke

# Test with turnutils_uclient
turnutils_uclient -u admin -w admin kesmis.go.ke
```

## Firewall Configuration

Ensure your firewall allows TURN server traffic:

```bash
# Allow TURN server ports
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp
```

## WebRTC Integration

The application has been updated with advanced WebRTC configuration that includes:

### ICE Server Configuration
- **STUN servers**: For NAT discovery and direct connections
- **TURN server (UDP)**: `turn:kesmis.go.ke:3478`
- **TURN server (TCP)**: `turn:kesmis.go.ke:3478?transport=tcp`
- **TURN server (TLS)**: `turns:kesmis.go.ke:5349`

### Advanced WebRTC Settings
- **iceCandidatePoolSize**: 10 (pre-gathers ICE candidates)
- **iceTransportPolicy**: 'all' (allows both STUN and TURN)
- **bundlePolicy**: 'max-bundle' (bundles RTP/RTCP streams)
- **rtcpMuxPolicy**: 'require' (requires RTCP multiplexing)

### Connection Flow
1. Try STUN servers first for direct connections
2. Fall back to TURN server for relayed connections
3. Use multiple transport protocols (UDP, TCP, TLS)
4. Pre-gather ICE candidates for faster connection establishment

## Monitoring

Monitor your TURN server:

```bash
# Check TURN server status
sudo systemctl status coturn

# View logs
sudo tail -f /var/log/turnserver.log

# Check active connections
sudo netstat -tulpn | grep :3478
```

## Troubleshooting

Common issues and solutions:

1. **Connection failures**: Check firewall rules and port accessibility
2. **Authentication errors**: Verify username/password in user database
3. **High bandwidth usage**: Monitor TURN server logs for relay usage
4. **Certificate issues**: Ensure TLS certificates are properly configured

## Performance Optimization

For better performance:

1. **Increase port range** if needed
2. **Monitor bandwidth usage**
3. **Set up multiple TURN servers** for redundancy
4. **Use load balancing** for high-traffic scenarios
