import { io, Socket } from 'socket.io-client';

export interface StreamInfo {
  streamId: string;
  title: string;
  streamerName: string;
  status: string;
  startTime?: string;
  viewerCount?: number;
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
  private events: WebRTCEvents | null = null;

  constructor() {
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    console.log('🔧 Setting up peer connection...');
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);
    console.log('✅ Peer connection created:', this.peerConnection);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        console.log('🧊 Sending ICE candidate');
        this.socket.emit('ice-candidate', {
          to: this.currentStreamId,
          candidate: event.candidate
        });
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
        v.setAttribute('playsinline', '');
        
        // Set the live stream
        v.srcObject = stream as any;
        console.log('✅ Live stream attached to video element');
        
        const tryPlay = () => {
          const p = v.play();
          if (p && typeof (p as any).catch === 'function') {
            p.catch((err: any) => {
              if (err && (err.name === 'AbortError' || err.code === 20)) {
                console.log('🔄 Live stream play() aborted; will retry on canplay');
              } else {
                console.error('❌ Live stream play() failed:', err);
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
        };
        
        v.addEventListener('canplay', onCanPlay as any, { once: true } as any);
        v.addEventListener('loadedmetadata', onLoadedMetadata as any, { once: true } as any);
        
        // Try immediate play
        console.log('🎮 Attempting immediate play of live stream');
        tryPlay();
        
        // Fallback: try again after a short delay
        setTimeout(() => {
          console.log('🎮 Fallback play attempt after 1 second');
          tryPlay();
        }, 1000);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 Connection state:', state);
      this.events?.onConnectionStateChange(state || 'unknown');
      
      if (state === 'connected') {
        this.isConnected = true;
      } else if (state === 'disconnected' || state === 'failed') {
        this.isConnected = false;
      }
    };
    
    console.log('✅ Peer connection setup completed');
  }

  async connectToSignalingServer(serverUrl = 'http://kesmis.go.ke:3000'): Promise<boolean> {
    try {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.on('connect', () => {
          console.log('🔌 Connected to signaling server:', this.socket!.id);
          clearTimeout(timeout);
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
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
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            this.socket!.emit('answer', {
              to: from,
              answer: answer
            });
          }
        });

        this.socket!.on('answer', async ({ from, answer }) => {
          console.log('📥 Received answer from:', from);
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(answer);
          }
        });

        this.socket!.on('ice-candidate', async ({ from, candidate }) => {
          console.log('🧊 Received ICE candidate from:', from);
          if (this.peerConnection && candidate) {
            await this.peerConnection.addIceCandidate(candidate);
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
    
    if (this.peerConnection) {
      console.log('🔌 Closing existing peer connection...');
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.videoElement) {
      console.log('📺 Cleaning up video element...');
      // Stop the video and clear the stream
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      
      // Remove all event listeners to prevent memory leaks
      this.videoElement.removeEventListener('play', () => {});
      this.videoElement.removeEventListener('pause', () => {});
      this.videoElement.removeEventListener('ended', () => {});
    }

    this.currentStreamId = null;
    this.isConnected = false;
    
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
}

// Export singleton instance
export const webrtcService = new WebRTCService();
