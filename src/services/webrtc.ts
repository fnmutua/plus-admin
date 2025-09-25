import { io, Socket } from 'socket.io-client';

// Updated interface with location fields
export interface StreamInfo {
  streamId: string;
  title: string;
  streamerName: string;
  status: string;
  startTime?: string;
  viewerCount?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  ward?: {
    id: number;
    name: string;
  };
  subcounty?: {
    id: number;
    name: string;
  };
  county?: {
    id: number;
    name: string;
  };
}

export interface WebRTCEvents {
  onStreamEnded: () => void;
  onViewerJoined: (data: { viewerId: string }) => void;
  onViewerDisconnected: (data: { viewerId: string }) => void;
  onConnectionStateChange: (state: string) => void;
  onServerInfo?: (data: any) => void;
}

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isConnected = false;
  private currentStreamId: string | null = null;
  private broadcasterSocketId: string | null = null;
  private events: WebRTCEvents | null = null;
  private networkType: 'same' | 'cross' | 'unknown' = 'unknown';
  private turnServerStatus: 'working' | 'failed' | 'untested' = 'untested';

  constructor() {
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    console.log('🔧 Setting up peer connection...');
    
    const configuration = {
      iceServers: [
        // STUN servers for discovering public IP
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        
        // Your TURN server - primary configuration
        {
          urls: [
            "turn:kesmis.go.ke:3478", 
            "turn:kesmis.go.ke:3478?transport=udp",
            "turn:kesmis.go.ke:3478?transport=tcp"
          ],
          username: "admin",
          credential: "admin"
        }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
    

    this.peerConnection = new RTCPeerConnection(configuration);
    console.log('✅ Peer connection created:', this.peerConnection);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      console.log('🧊 Sending ICE candidate:', event.candidate?.type, event.candidate?.protocol);
      console.log('🌐 Candidate address:', event.candidate?.address || 'unknown');
      console.log('🔍 Debug state:', {
        hasCandidate: !!event.candidate,
        hasSocket: !!this.socket,
        broadcasterSocketId: this.broadcasterSocketId,
        currentStreamId: this.currentStreamId
      });
      
      if (event.candidate && this.socket && this.broadcasterSocketId) {
        console.log('📤 Sending to broadcaster:', this.broadcasterSocketId);
        this.socket.emit('ice-candidate', {
          to: this.broadcasterSocketId,
          candidate: event.candidate
        });
        console.log('✅ ICE candidate sent successfully');
      } else if (!event.candidate) {
        console.log('✅ ICE gathering completed');
      } else if (!this.broadcasterSocketId) {
        console.warn('⚠️ Cannot send ICE candidate - no broadcaster socket ID stored!');
        console.warn('💡 This means the offer handler did not store the broadcaster ID');
      } else if (!this.socket) {
        console.warn('⚠️ Cannot send ICE candidate - no socket connection');
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received real remote stream from broadcaster');
      if (this.videoElement && event.streams[0]) {
        const v = this.videoElement;
        const stream = event.streams[0];
        
        console.log('🎥 Setting up live video stream:', stream.id);
        
        // Pause any existing content
        try { v.pause(); } catch (_) {}
        
        // Ensure proper settings for autoplay
        v.muted = true;
        v.autoplay = true;
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
        
        // Set the live stream
        v.srcObject = stream as any;
        console.log('✅ Live stream attached to video element');
        
        // Force immediate play attempt
        v.play().catch(err => {
          console.log('🎮 Initial autoplay blocked:', err.name);
          console.log('💡 User gesture required - video will play when user clicks');
        });
        
        const tryPlay = () => {
          console.log('🎮 Attempting to play video - readyState:', v.readyState);
          console.log('🎮 Video properties - paused:', v.paused, 'muted:', v.muted, 'src:', !!v.srcObject);
          
          const p = v.play();
          if (p && typeof (p as any).catch === 'function') {
            p.then(() => {
              console.log('✅ Video playing successfully');
            }).catch((err: any) => {
              if (err && (err.name === 'AbortError' || err.code === 20)) {
                console.log('🔄 Live stream play() aborted; will retry on canplay');
              } else {
                console.error('❌ Live stream play() failed:', err);
                console.error('💡 Try clicking on the video to manually start playback');
              }
            });
          }
        };
        
        const onCanPlay = () => {
          v.removeEventListener('canplay', onCanPlay as any);
          console.log('🎬 Live stream ready to play - canplay event fired');
          tryPlay();
        };
        
        const onLoadedMetadata = () => {
          v.removeEventListener('loadedmetadata', onLoadedMetadata as any);
          console.log('🎬 Live stream metadata loaded');
          console.log('📊 Video dimensions:', v.videoWidth, 'x', v.videoHeight);
          console.log('📊 Video duration:', v.duration);
          console.log('📊 Video readyState:', v.readyState);
          console.log('📊 Video networkState:', v.networkState);
          
          // Check if video tracks are muted
          const videoTracks = stream.getVideoTracks();
          const audioTracks = stream.getAudioTracks();
          
          if (videoTracks.length > 0 && videoTracks[0].muted) {
            console.warn('⚠️ Video track is muted - this will cause a black screen');
            console.log('📱 This usually means the broadcaster has disabled their camera');
          }
          
          if (audioTracks.length > 0 && audioTracks[0].muted) {
            console.warn('⚠️ Audio track is muted - no sound will be heard');
          }
          
          if (v.videoWidth === 0 || v.videoHeight === 0) {
            console.warn('⚠️ Video dimensions are 0x0 - no video content detected');
          }
          
          // Force play after metadata loads
          console.log('🎮 Forcing play after metadata loaded...');
          tryPlay();
        };
        
        v.addEventListener('canplay', onCanPlay as any, { once: true } as any);
        v.addEventListener('loadedmetadata', onLoadedMetadata as any, { once: true } as any);
        
        // Wait for tracks to be ready
        const checkTracks = () => {
          const videoTracks = stream.getVideoTracks();
          const audioTracks = stream.getAudioTracks();
          
          console.log('🎵 Audio tracks:', audioTracks.length, audioTracks.map(t => t.readyState));
          console.log('📹 Video tracks:', videoTracks.length, videoTracks.map(t => t.readyState));
          
          if (videoTracks.length > 0) {
            const videoTrack = videoTracks[0];
            console.log('📹 Video track state:', videoTrack.readyState, 'enabled:', videoTrack.enabled);
            
            if (videoTrack.readyState === 'live') {
              console.log('✅ Video track is live - attempting play');
              console.log('🔍 Track details:', {
                id: videoTrack.id,
                kind: videoTrack.kind,
                label: videoTrack.label,
                enabled: videoTrack.enabled,
                muted: videoTrack.muted,
                readyState: videoTrack.readyState
              });
              
              // Multiple aggressive play attempts
              tryPlay();
              setTimeout(() => {
                console.log('🔄 Retry play after track ready...');
                tryPlay();
              }, 100);
              setTimeout(() => {
                console.log('🔄 Final retry play after track ready...');
                tryPlay();
              }, 500);
            } else {
              console.log('⏳ Video track not ready yet, waiting...');
              setTimeout(checkTracks, 500);
            }
          } else {
            console.log('❌ No video tracks found');
          }
        };
        
        // Try immediate play
        console.log('🎮 Attempting immediate play of live stream');
        tryPlay();
        
        // Check track states
        setTimeout(checkTracks, 100);
        
        // Fallback: try again after delays
        setTimeout(() => {
          console.log('🎮 Fallback play attempt after 1 second');
          tryPlay();
        }, 1000);
        
        setTimeout(() => {
          console.log('🎮 Final fallback play attempt after 3 seconds');
          tryPlay();
        }, 3000);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 WebRTC Connection state:', state);
      this.events?.onConnectionStateChange(state || 'unknown');
      
      if (state === 'connected') {
        this.isConnected = true;
        console.log('✅ WebRTC peer connection established successfully!');
      } else if (state === 'disconnected') {
        this.isConnected = false;
        console.warn('⚠️ WebRTC connection disconnected - may reconnect automatically');
      } else if (state === 'failed') {
        this.isConnected = false;
        console.error('❌ WebRTC connection failed - likely NAT/firewall issue');
        console.error('💡 Suggestion: Check TURN server configuration or network settings');
      } else if (state === 'connecting') {
        console.log('🔄 WebRTC connection in progress...');
      }
    };

    // Handle ICE connection state changes (more detailed)
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection?.iceConnectionState;
      console.log('🧊 ICE connection state:', iceState);
      
      if (iceState === 'checking') {
        console.log('🔍 ICE checking - trying different connection paths...');
      } else if (iceState === 'connected') {
        console.log('✅ ICE connected - media should start flowing now');
        this.logConnectionPath();
        this.checkMediaFlow();
      } else if (iceState === 'completed') {
        console.log('✅ ICE completed - optimal connection path established');
        this.logConnectionPath();
        this.checkMediaFlow();
      } else if (iceState === 'failed') {
        console.error('❌ ICE connection failed - trying TURN server fallback');
        console.error('💡 This usually means both users are behind symmetric NAT');
        console.log('🔄 Setting up TURN-only restart in 1 second...');
        // Try to restart ICE with TURN-only
        setTimeout(() => {
          console.log('⏰ TURN-only restart timeout triggered');
          this.restartIceWithTurnOnly();
        }, 1000);
      } else if (iceState === 'disconnected') {
        console.warn('⚠️ ICE connection lost - will attempt automatic recovery');
        console.log('⏰ Setting up 3-second recovery timer...');
        // Give it some time to reconnect before taking action
        setTimeout(() => {
          const currentState = this.peerConnection?.iceConnectionState;
          console.log(`🔍 Checking ICE state after 3s: ${currentState}`);
          if (currentState === 'disconnected' || currentState === 'failed') {
            console.log('🔄 ICE still disconnected/failed after 3s, attempting restart...');
            this.restartIceWithTurnOnly();
          } else {
            console.log('✅ ICE recovered naturally, no restart needed');
          }
        }, 3000);
      }
    };
    
    console.log('✅ Peer connection setup completed');
  }

  async connectToSignalingServer(serverUrl = 'https://kesmis.go.ke'): Promise<boolean> {
    try {
      this.socket = io(serverUrl, {
        path: '/stream/socket.io',
        transports: ['websocket', 'polling'],
        timeout: 15000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false,
        secure: true,
        rejectUnauthorized: false
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - check nginx proxy and server'));
        }, 15000);

        this.socket!.on('connect', () => {
          console.log('🔌 Connected to signaling server via HTTPS/WSS:', this.socket!.id);
          console.log('✅ WebSocket connection established through nginx proxy');
          clearTimeout(timeout);
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          console.error('❌ Error details:', error.message);
          console.error('❌ Check nginx proxy configuration for /stream path');
          clearTimeout(timeout);
          reject(error);
        });

        this.socket!.on('disconnect', () => {
          console.log('🔌 Disconnected from signaling server');
          this.isConnected = false;
        });

        // Handle WebRTC signaling events
        this.socket!.on('offer', async ({ from, offer }) => {
          console.log('📤 Received offer from:', from);
          console.log('💾 Storing broadcaster socket ID...');
          this.broadcasterSocketId = from; // Store broadcaster socket ID
          console.log('✅ Broadcaster socket ID stored:', this.broadcasterSocketId);
          
          if (this.peerConnection) {
            console.log('🔧 Processing offer and creating answer...');
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            this.socket!.emit('answer', {
              to: from,
              answer: answer
            });
            console.log('📤 Sent answer back to broadcaster:', from);
            console.log('🎯 Ready to send ICE candidates to:', this.broadcasterSocketId);
          } else {
            console.error('❌ No peer connection available for offer processing');
          }
        });

        this.socket!.on('answer', async ({ from, answer }) => {
          console.log('📥 Received answer from:', from);
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(answer);
          }
        });

        this.socket!.on('ice-candidate', async ({ from, candidate }) => {
          console.log('🧊 Received ICE candidate from:', from, 'type:', candidate?.type);
          if (this.peerConnection && candidate) {
            try {
              await this.peerConnection.addIceCandidate(candidate);
              console.log('✅ ICE candidate added successfully');
            } catch (error) {
              console.error('❌ Failed to add ICE candidate:', error);
              // Continue anyway - some candidates may fail but others might work
            }
          }
        });

        // Handle stream events
        this.socket!.on('stream-ended', () => {
          console.log('📡 Stream ended');
          this.events?.onStreamEnded();
        });

        this.socket!.on('viewer-joined', (data) => {
          console.log('📺 Viewer joined:', data);
          this.events?.onViewerJoined(data);
        });

        this.socket!.on('viewer-disconnected', (data) => {
          console.log('📺 Viewer disconnected:', data);
          this.events?.onViewerDisconnected(data);
        });

        // Handle pong response
        this.socket!.on('pong', (data) => {
          console.log('🏓 Server pong:', data);
          this.events?.onServerInfo?.(data);
        });
      });
    } catch (error) {
      console.error('❌ Failed to connect to signaling server:', error);
      return false;
    }
  }

  async joinStream(streamId: string, videoElement: HTMLVideoElement): Promise<boolean> {
    console.log('🎬 WebRTC joinStream called with:', { streamId, videoElement });
    console.log('🔍 Socket status:', this.socket ? 'exists' : 'null');
    console.log('🔍 PeerConnection status:', this.peerConnection ? 'exists' : 'null');
    console.log('🔍 Socket connected:', this.socket?.connected);
    
    if (!this.socket) {
      console.error('❌ Socket not connected to signaling server');
      return false;
    }
    
    // Ensure peer connection exists
    if (!this.ensurePeerConnection()) {
      console.error('❌ Failed to create peer connection');
      return false;
    }

    try {
      console.log('✅ Pre-checks passed in joinStream');
      this.currentStreamId = streamId;
      this.videoElement = videoElement;

      // Join the stream room
      console.log('📡 Emitting join-stream event...');
      this.socket.emit('join-stream', { streamId });
      console.log('📺 Joining stream:', streamId);

      // Prepare video element for incoming stream
      console.log('⏳ Waiting for real WebRTC stream from broadcaster...');
      videoElement.muted = true;
      videoElement.setAttribute('playsinline', '');
      console.log('✅ Video element prepared for incoming stream');

      return true;
    } catch (error) {
      console.error('❌ Failed to join stream:', error);
      return false;
    }
  }


  async startBroadcast(streamId: string, localStream: MediaStream): Promise<boolean> {
    if (!this.socket || !this.peerConnection) {
      console.error('❌ Not connected to signaling server');
      return false;
    }

    try {
      this.currentStreamId = streamId;

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, localStream);
      });

      // Start broadcast
      this.socket.emit('start-broadcast', { streamId });
      console.log('📡 Started broadcasting stream:', streamId);

      return true;
    } catch (error) {
      console.error('❌ Failed to start broadcast:', error);
      return false;
    }
  }

  async stopBroadcast(): Promise<void> {
    if (!this.socket || !this.currentStreamId) {
      return;
    }

    try {
      this.socket.emit('stop-broadcast', { streamId: this.currentStreamId });
      console.log('📡 Stopped broadcasting stream:', this.currentStreamId);
    } catch (error) {
      console.error('❌ Failed to stop broadcast:', error);
    }
  }

  async leaveStream(): Promise<void> {
    console.log('🚪 Leaving stream...');
    
    if (this.currentStreamId && this.socket) {
      console.log('📡 Emitting leave-stream event...');
      this.socket.emit('leave-stream', { streamId: this.currentStreamId });
    }
    
    if (this.peerConnection) {
      console.log('🔌 Closing existing peer connection...');
      this.peerConnection.close();
      this.setupPeerConnection(); // Recreate for next stream
    }

    if (this.videoElement) {
      console.log('📺 Cleaning up video element...');
      // Stop the video and clear the stream
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.currentStreamId = null;
    this.broadcasterSocketId = null;
    
    console.log('✅ Stream left successfully');
  }

  pingServer(): void {
    if (this.socket) {
      this.socket.emit('ping');
    }
  }

  setEvents(events: WebRTCEvents): void {
    this.events = events;
  }

  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'unknown';
  }

  isStreamConnected(): boolean {
    return this.isConnected && this.socket !== null && this.socket.connected;
  }

  isSocketConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  disconnect(): void {
    console.log('🔌 Disconnecting WebRTC service...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.isConnected = false;
    this.currentStreamId = null;
    
    console.log('✅ WebRTC service disconnected');
  }
  
  // Method to ensure peer connection is available
  ensurePeerConnection(): boolean {
    if (!this.peerConnection) {
      console.log('🔧 Creating new peer connection...');
      this.setupPeerConnection();
      return this.peerConnection !== null;
    }
    return true;
  }

  // Log the connection path being used
  private logConnectionPath(): void {
    if (!this.peerConnection) return;
    
    this.peerConnection.getStats().then(stats => {
      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          console.log('🌐 Active connection path:', report);
          console.log('🔗 Local candidate:', report.localCandidateId);
          console.log('🔗 Remote candidate:', report.remoteCandidateId);
        }
        if (report.type === 'local-candidate' && report.candidateType) {
          console.log('📍 Local candidate type:', report.candidateType, report.ip || 'unknown');
        }
        if (report.type === 'remote-candidate' && report.candidateType) {
          console.log('📍 Remote candidate type:', report.candidateType, report.ip || 'unknown');
        }
      });
    }).catch(err => {
      console.log('📊 Could not get connection stats:', err);
    });
  }

  // Check if media is flowing through the connection
  private checkMediaFlow(): void {
    if (!this.peerConnection || !this.videoElement) return;
    
    console.log('🔍 Checking media flow...');
    
    // Check video element state
    const v = this.videoElement;
    console.log('📺 Video element - readyState:', v.readyState, 'networkState:', v.networkState);
    console.log('📺 Video element styles:', {
      display: getComputedStyle(v).display,
      visibility: getComputedStyle(v).visibility,
      opacity: getComputedStyle(v).opacity,
      width: getComputedStyle(v).width,
      height: getComputedStyle(v).height,
      position: getComputedStyle(v).position
    });
    console.log('📺 Video element bounds:', v.getBoundingClientRect());
    
    // Force video to play when connection is established
    if (v.readyState === 0 && v.srcObject) {
      console.log('🎮 Forcing video play after ICE connection...');
      v.load(); // Reload the video element
      setTimeout(() => {
        v.play().catch(err => {
          console.log('🎮 Auto-play blocked, user interaction required');
        });
      }, 200);
    }
    
    // Check if we're getting media data
    setTimeout(() => {
      if (v.readyState > 0) {
        console.log('✅ Media data is flowing - video should be visible');
        console.log('🎯 Final video check:', {
          currentTime: v.currentTime,
          videoWidth: v.videoWidth,
          videoHeight: v.videoHeight,
          paused: v.paused,
          ended: v.ended,
          buffered: v.buffered.length > 0 ? `${v.buffered.start(0)}-${v.buffered.end(0)}` : 'empty'
        });
        
        // Force refresh of video display
        v.style.display = 'none';
        v.offsetHeight; // Force reflow
        v.style.display = 'block';
      } else {
        console.warn('⚠️ No media data after 2 seconds - possible codec or bandwidth issue');
        console.warn('💡 The broadcaster may have video disabled or poor connection');
      }
    }, 2000);
  }

  // Test TURN server connectivity
  private async testTurnServer(): Promise<boolean> {
    console.log('🔍 Testing TURN server connectivity...');
    
    return new Promise((resolve) => {
      const testConfig = {
        iceServers: [
          {
            urls: ["turn:kesmis.go.ke:3478"],
            username: "admin",
            credential: "admin"
          }
        ]
      };
      
      const testPC = new RTCPeerConnection(testConfig);
      let hasRelayCandidate = false;
      
      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        testPC.close();
      };
      
      const timeout = setTimeout(() => {
        cleanup();
        console.log('⏱️ TURN test timeout');
        this.turnServerStatus = 'failed';
        resolve(false);
      }, 10000);
      
      testPC.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          console.log('🧊 Test candidate:', candidate);
          
          if (candidate.includes('relay')) {
            hasRelayCandidate = true;
            console.log('✅ TURN server working - relay candidate found');
            this.turnServerStatus = 'working';
            cleanup();
            resolve(true);
          }
        } else {
          // ICE gathering complete
          console.log(`🏁 Test ICE gathering complete - relay found: ${hasRelayCandidate}`);
          this.turnServerStatus = hasRelayCandidate ? 'working' : 'failed';
          cleanup();
          resolve(hasRelayCandidate);
        }
      };
      
      testPC.onerror = (error) => {
        console.error('❌ TURN test error:', error);
        this.turnServerStatus = 'failed';
        cleanup();
        resolve(false);
      };
      
      // Create offer to start ICE gathering
      testPC.createDataChannel('test');
      testPC.createOffer().then(offer => {
        return testPC.setLocalDescription(offer);
      }).catch(error => {
        console.error('❌ TURN test offer failed:', error);
        this.turnServerStatus = 'failed';
        cleanup();
        resolve(false);
      });
    });
  }

  // Detect network scenario based on ICE candidates
  private detectNetworkScenario(candidates: RTCIceCandidate[]): 'same' | 'cross' | 'unknown' {
    const hasHost = candidates.some(c => c.candidate.includes('host'));
    const hasSrflx = candidates.some(c => c.candidate.includes('srflx'));
    const hasRelay = candidates.some(c => c.candidate.includes('relay'));
    
    console.log('🌐 Network analysis:', { hasHost, hasSrflx, hasRelay });
    
    if (hasHost && !hasSrflx && !hasRelay) {
      console.log('🏠 Same network detected (host candidates only)');
      return 'same';
    } else if (hasSrflx || hasRelay) {
      console.log('🌍 Cross-network detected (STUN/TURN candidates)');
      return 'cross';
    }
    
    console.log('❓ Unknown network scenario');
    return 'unknown';
  }

  // Get adaptive WebRTC configuration based on network type and TURN status
  private getAdaptiveConfig(): RTCConfiguration {
    console.log(`🔧 Getting config for network: ${this.networkType}, TURN: ${this.turnServerStatus}`);
    
    if (this.networkType === 'cross' && this.turnServerStatus === 'working') {
      console.log('🌍 Using cross-network optimized config with TURN');
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: [
              "turn:kesmis.go.ke:3478",
              "turn:kesmis.go.ke:3478?transport=udp", 
              "turn:kesmis.go.ke:3478?transport=tcp"
            ],
            username: "admin",
            credential: "admin"
          }
        ],
        iceCandidatePoolSize: 15,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };
    } else if (this.networkType === 'same') {
      console.log('🏠 Using same-network optimized config');
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 5,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };
    } else {
      console.log('🔧 Using default config');
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          {
            urls: [
              "turn:kesmis.go.ke:3478", 
              "turn:kesmis.go.ke:3478?transport=udp",
              "turn:kesmis.go.ke:3478?transport=tcp"
            ],
            username: "admin",
            credential: "admin"
          }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };
    }
  }

  // Restart ICE with TURN-only configuration for cross-network issues
  private async restartIceWithTurnOnly(): Promise<void> {
    console.log('🔄 Restarting ICE with TURN-only configuration...');
    
    if (!this.peerConnection || !this.socket || !this.currentStreamId) {
      console.error('❌ Cannot restart ICE - missing peer connection, socket, or stream ID');
      return;
    }

    try {
      // First, try with TURN-only configuration
      const turnOnlyConfig = {
        iceServers: [
          // Only your TURN server - force relay
          {
            urls: [
              "turn:kesmis.go.ke:3478", 
              "turn:kesmis.go.ke:3478?transport=udp",
              "turn:kesmis.go.ke:3478?transport=tcp"
            ],
            username: "admin",
            credential: "admin"
          }
        ],
        iceCandidatePoolSize: 15,
        iceTransportPolicy: 'relay', // Force TURN usage
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      };

      // Update the configuration
      await this.peerConnection.setConfiguration(turnOnlyConfig);
      console.log('✅ Updated to TURN-only configuration');

      // Create a fresh offer with ICE restart
      console.log('🔄 Creating ICE restart offer...');
      const restartOffer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(restartOffer);
      
      // Send restart offer through signaling
      this.socket.emit('ice-restart-offer', {
        offer: restartOffer,
        streamId: this.currentStreamId
      });
      
      console.log('📤 ICE restart offer sent to broadcaster');
      
    } catch (error) {
      console.error('❌ Failed to restart ICE:', error);
      
      // Last resort: recreate the entire peer connection
      console.log('🔄 Attempting full peer connection restart...');
      try {
        this.setupPeerConnection();
        if (this.videoElement && this.currentStreamId) {
          // Try to rejoin the stream
          setTimeout(() => {
            this.socket?.emit('rejoin-stream', { streamId: this.currentStreamId });
          }, 500);
        }
      } catch (recreateError) {
        console.error('❌ Failed to recreate peer connection:', recreateError);
      }
    }
  }

  // Initialize with network detection and TURN testing
  async initialize(): Promise<void> {
    console.log('🚀 Initializing WebRTC service with diagnostics...');
    
    // Test TURN server first
    const turnWorking = await this.testTurnServer();
    console.log(`🔄 TURN server test result: ${turnWorking ? 'working' : 'failed'}`);
    
    // For now, assume unknown network until we get ICE candidates
    this.networkType = 'unknown';
    
    console.log('✅ WebRTC service initialized');
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();
