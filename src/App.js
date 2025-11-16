import { useState, useEffect, useRef } from 'react';
import { auth, storage } from './firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,   // NEW: keeps user state in sync
  updateProfile         // NEW: lets you set displayName, photoURL, etc.
} from 'firebase/auth';

import designs from './data/designs.json';
import DesignCard from './components/DesignCard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentPage, setCurrentPage] = useState('profile');
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [profileBgImage, setProfileBgImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs for the Videos tab upload inputs
  const newVideoTitleRef = useRef(null);
  const newVideoDescRef = useRef(null);
  const newVideoUrlRef = useRef(null);
  const newVideoFileRef = useRef(null);
  const newVideoAddToProfileRef = useRef(null);
  const [profileTextColor, setProfileTextColor] = useState('#ffffff');
  const [profileFontUrl, setProfileFontUrl] = useState('');
  const [profileBorderColor, setProfileBorderColor] = useState('#00ffcc');
  const [profileButtonColor, setProfileButtonColor] = useState('#00ffcc');
  const [profileDisplayPic, setProfileDisplayPic] = useState('');
  const [profileTheme, setProfileTheme] = useState('dark');
  const [profileLayout, setProfileLayout] = useState('classic');
  const [videos, setVideos] = useState([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempBgImage, setTempBgImage] = useState('');
  const [tempTextColor, setTempTextColor] = useState('#ffffff');
  const [tempFontUrl, setTempFontUrl] = useState('');
  const [tempBorderColor, setTempBorderColor] = useState('#00ffcc');
  const [tempButtonColor, setTempButtonColor] = useState('#00ffcc');
  const [tempDisplayPic, setTempDisplayPic] = useState('');
  const [tempTheme, setTempTheme] = useState('dark');
  const [tempLayout, setTempLayout] = useState('classic');

  // Load saved profile settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gsg_profile');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.profileBgImage) setProfileBgImage(s.profileBgImage);
        if (s.profileTextColor) setProfileTextColor(s.profileTextColor);
        if (s.profileFontUrl) setProfileFontUrl(s.profileFontUrl);
        if (s.profileBorderColor) setProfileBorderColor(s.profileBorderColor);
        if (s.profileButtonColor) setProfileButtonColor(s.profileButtonColor);
        if (s.profileDisplayPic) setProfileDisplayPic(s.profileDisplayPic);
        if (s.profileTheme) setProfileTheme(s.profileTheme);
        if (s.profileLayout) setProfileLayout(s.profileLayout);
        if (s.videos) setVideos(s.videos);
        if (s.uploadedVideos) setUploadedVideos(s.uploadedVideos);
      }
    } catch (err) {
      console.warn('Failed to load profile settings', err);
    }
  }, []);

  // Keep a CSS variable for button color so tab buttons and others update live
  useEffect(() => {
    const btn = isEditingProfile ? tempButtonColor : profileButtonColor;
    try {
      document.documentElement.style.setProperty('--gsg-button-color', btn || '#00ffcc');
    } catch (err) {
      console.warn('Failed to set button color var', err);
    }
  }, [profileButtonColor, tempButtonColor, isEditingProfile]);

  const handleSaveProfile = () => {
    setProfileBgImage(tempBgImage);
    setProfileTextColor(tempTextColor);
    setProfileFontUrl(tempFontUrl);
    setProfileBorderColor(tempBorderColor);
    setProfileButtonColor(tempButtonColor);
    setProfileDisplayPic(tempDisplayPic);
    setProfileTheme(tempTheme);
    setProfileLayout(tempLayout);

    const payload = {
      profileBgImage: tempBgImage,
      profileTextColor: tempTextColor,
      profileFontUrl: tempFontUrl,
      profileBorderColor: tempBorderColor,
      profileButtonColor: tempButtonColor,
      profileDisplayPic: tempDisplayPic,
      profileTheme: tempTheme,
      profileLayout: tempLayout,
      videos: videos,
      uploadedVideos: uploadedVideos,
    };
    try {
      localStorage.setItem('gsg_profile', JSON.stringify(payload));
    } catch (err) {
      console.warn('Failed to save profile settings', err);
    }

    setIsEditingProfile(false);
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      alert('Error signing out: ' + error.message);
    }
  };

  // Upload a new video using refs and show progress
  const handleUploadVideo = async () => {
    try {
      const title = newVideoTitleRef.current?.value?.trim();
      const desc = newVideoDescRef.current?.value || '';
      const urlVal = newVideoUrlRef.current?.value?.trim();
      const file = newVideoFileRef.current?.files?.[0];
      const addToProfile = !!newVideoAddToProfileRef.current?.checked;

      if (!title) return alert('Please enter a title for the video');

      setUploading(true);
      setUploadProgress(0);

      let finalUrl = urlVal;

      if (!finalUrl && file) {
        const path = `videos/${user?.uid || 'guest'}/${Date.now()}_${file.name}`;
        const sRef = storageRef(storage, path);
        const uploadTask = uploadBytesResumable(sRef, file);
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', (snapshot) => {
            if (snapshot.totalBytes) {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(pct);
            }
          }, (err) => reject(err), () => resolve());
        });
        finalUrl = await getDownloadURL(storageRef(storage, path));
      }

      setUploadProgress(100);

      if (!finalUrl) {
        setUploading(false);
        return alert('Please provide a video URL or upload a file.');
      }

      const newVideo = {
        id: Date.now(),
        title,
        description: desc,
        url: finalUrl,
        timestamp: new Date().toLocaleString(),
      };

      const newUploaded = [newVideo, ...uploadedVideos];
      setUploadedVideos(newUploaded);

      let newProfileVideos = videos;
      if (addToProfile) {
        newProfileVideos = [newVideo, ...videos];
        setVideos(newProfileVideos);
      }

      try {
        const raw = localStorage.getItem('gsg_profile');
        const s = raw ? JSON.parse(raw) : {};
        s.uploadedVideos = newUploaded;
        s.videos = newProfileVideos;
        localStorage.setItem('gsg_profile', JSON.stringify(s));
      } catch (err) {
        console.warn('Failed to persist uploaded video', err);
      }

      // clear inputs
      if (newVideoTitleRef.current) newVideoTitleRef.current.value = '';
      if (newVideoDescRef.current) newVideoDescRef.current.value = '';
      if (newVideoUrlRef.current) newVideoUrlRef.current.value = '';
      if (newVideoFileRef.current) newVideoFileRef.current.value = '';
    } catch (err) {
      console.error('Upload failed', err);
      alert('Video upload failed. See console for details.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = (id) => {
    const updatedUploaded = uploadedVideos.filter((v) => v.id !== id);
    setUploadedVideos(updatedUploaded);
    const updatedProfileVideos = videos.filter((v) => v.id !== id);
    setVideos(updatedProfileVideos);
    try {
      const raw = localStorage.getItem('gsg_profile');
      const s = raw ? JSON.parse(raw) : {};
      s.uploadedVideos = updatedUploaded;
      s.videos = updatedProfileVideos;
      localStorage.setItem('gsg_profile', JSON.stringify(s));
    } catch (err) {
      console.warn('Failed to persist deletion', err);
    }
  };

  if (!user) {
    return (
      <div className="login-screen">
        <img src="/assets/konnect-logo.png" alt="Konnect Logo" className="login-logo" />
        <h1>{isRegistering ? 'Register' : 'Login'} to Konnect</h1>
        <p className="login-tagline">Today's Social Platform. Customize and Socialize. Be you!</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={isRegistering ? handleRegister : handleLogin}>
          {isRegistering ? 'Register' : 'Login'}
        </button>
        <p>
          {isRegistering ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            className="toggle-button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setEmail('');
              setPassword('');
            }}
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header">
        <div className="header-left">
          <img src="/assets/konnect-logo.png" alt="Logo" className="header-logo" />
          <div className="header-branding">
            <h1 className="logo-text">Konnect</h1>
            <p className="logo-tagline">Today's Social Platform. Customize and Socialize. Be you!</p>
          </div>
        </div>
        <div className="user-controls">
          <span className="welcome">Welcome, {user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="main-container">
        <aside className="side-ribbon">
          <nav className="ribbon-nav">
            <button
              className={`ribbon-btn ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentPage('profile')}
            >
              My Profile
            </button>
            <button
              className={`ribbon-btn ${currentPage === 'videos' ? 'active' : ''}`}
              onClick={() => setCurrentPage('videos')}
            >
              Videos
            </button>
            <button
              className={`ribbon-btn ${currentPage === 'gallery' ? 'active' : ''}`}
              onClick={() => setCurrentPage('gallery')}
            >
              Background Gallery
            </button>
          </nav>
        </aside>

        {currentPage === 'videos' && (
          <div className="gallery videos-gallery">
            <h2>📹 Videos Gallery</h2>
            
            <div className="video-upload-section">
              <h3>Upload Your Video</h3>
              <div className="video-upload-form-gallery">
                <div className="form-group">
                  <label>Video Title:</label>
                  <input ref={newVideoTitleRef} placeholder="Enter video title" className="modal-input" />
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea ref={newVideoDescRef} placeholder="Enter video description" rows={3} className="modal-input" />
                </div>

                <div className="form-group">
                  <label>Video File (or URL):</label>
                  <input ref={newVideoUrlRef} placeholder="Paste video URL (e.g. YouTube link)" className="modal-input" />
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Or upload a file:</label>
                    <input ref={newVideoFileRef} type="file" accept="video/*" />
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ color: '#ccc', fontSize: '0.9rem' }}>
                      <input ref={newVideoAddToProfileRef} type="checkbox" /> Add to my profile
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={handleUploadVideo} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  {uploading && (
                    <div style={{ width: '160px', height: '12px', background: '#eee', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg,#4caf50,#81c784)' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Your Videos</h3>
            {uploadedVideos.length > 0 ? (
              <div className="design-grid">
                {uploadedVideos.map((video) => (
                  <div key={video.id} className="video-gallery-card">
                    <div
                      className="video-thumbnail-large"
                      onClick={() => setSelectedVideo(video)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="play-icon">▶️</div>
                    </div>
                    <div className="video-info">
                      <h4>{video.title}</h4>
                      <p>{video.description}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input value={video.url} readOnly className="image-link-input" />
                        <button
                          onClick={() => {
                            try {
                              navigator.clipboard?.writeText(video.url);
                            } catch (err) {
                              console.warn('Copy failed', err);
                            }
                          }}
                        >
                          Copy
                        </button>
                        <button onClick={() => handleDeleteVideo(video.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No videos uploaded yet.</p>
            )}

            </div>

        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="video-player-overlay" onClick={() => setSelectedVideo(null)}>
            <div className="video-player-modal" onClick={(e) => e.stopPropagation()}>
              <button 
                className="video-player-close"
                onClick={() => setSelectedVideo(null)}
              >
                ✕
              </button>
              
              <div className="video-player-container">
                {(() => {
                  // Basic detection for YouTube links (youtu.be or youtube.com)
                  const url = selectedVideo.url || '';
                  const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(url);
                  if (isYouTube) {
                    // extract video id
                    let idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
                    if (!idMatch) {
                      // try youtu.be short link
                      const shortMatch = url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
                      idMatch = shortMatch;
                    }
                    const videoId = idMatch ? idMatch[1] : null;
                    const embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
                    return (
                      <iframe
                        title={selectedVideo.title || 'YouTube Video'}
                        src={embedSrc}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      />
                    );
                  }

                  // fallback to HTML5 video element for direct video files
                  return (
                    <video
                      key={selectedVideo.id}
                      controls
                      autoPlay
                      className="video-element"
                      width="100%"
                      height="auto"
                    >
                      <source src={selectedVideo.url} type="video/mp4" />
                      <p>Your browser doesn't support HTML5 video.</p>
                    </video>
                  );
                })()}
              </div>

              <div className="video-player-info">
                <h2>{selectedVideo.title}</h2>
                <p>{selectedVideo.description}</p>
                <small>{selectedVideo.timestamp}</small>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'gallery' && (
          <div className="gallery">
            <h2>Featured Designs</h2>
            <div className="design-grid">
              {designs.map((design, index) => (
                <DesignCard key={index} design={design} />
              ))}
            </div>
          </div>
        )}

        {currentPage === 'profile' && (
          <div 
            className="profile-page"
            style={{
              ...(profileBgImage ? { backgroundImage: `url(${profileBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
              border: `6px solid ${profileBorderColor}`,
              boxSizing: 'border-box'
            }}
            data-theme={profileTheme}
          >
            <h2>My Profile</h2>
            <div 
              className="profile-content"
            >
              {profileDisplayPic && (
                <div className="profile-display-pic">
                  <img src={profileDisplayPic} alt="Profile" />
                </div>
              )}
              <div className="profile-info" style={{ color: profileTextColor, fontFamily: profileFontUrl || 'inherit' }}>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.uid}</p>
                <p>Welcome to your profile page!</p>
              </div>

              {/* Video Uploads Section */}
              <div className="video-uploads-section">
                <h3>📹 Video Uploads</h3>
                
                <div className="video-upload-form">
                  <div className="video-input-group">
                    <label htmlFor="videoTitle">Video Title:</label>
                    <input
                      id="videoTitle"
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title"
                    />
                  </div>
                  
                  <div className="video-input-group">
                    <label htmlFor="videoDesc">Description:</label>
                    <textarea
                      id="videoDesc"
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      placeholder="Enter video description"
                      rows="3"
                    />
                  </div>

                  <button
                    className="video-upload-btn"
                    onClick={() => {
                      if (videoTitle.trim()) {
                        const newVideo = {
                          id: Date.now(),
                          title: videoTitle,
                          description: videoDescription,
                          timestamp: new Date().toLocaleString(),
                        };
                        setVideos([newVideo, ...videos]);
                        setVideoTitle('');
                        setVideoDescription('');
                      }
                    }}
                  >
                    Add Video
                  </button>
                </div>

                {videos.length > 0 ? (
                  <div className="videos-list">
                    {videos.map((video) => (
                      <div key={video.id} className="video-card">
                        <div className="video-thumbnail">▶️</div>
                        <div className="video-card-info">
                          <div className="video-card-title">{video.title}</div>
                          <div className="video-card-desc">{video.description}</div>
                          <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.75rem' }}>
                            {video.timestamp}
                          </div>
                          <div className="video-card-actions">
                            <button onClick={() => {
                              const updatedProfile = videos.filter(v => v.id !== video.id);
                              const updatedUploaded = uploadedVideos.filter(v => v.id !== video.id);
                              setVideos(updatedProfile);
                              setUploadedVideos(updatedUploaded);
                              try {
                                const raw = localStorage.getItem('gsg_profile');
                                const s = raw ? JSON.parse(raw) : {};
                                s.videos = updatedProfile;
                                s.uploadedVideos = updatedUploaded;
                                localStorage.setItem('gsg_profile', JSON.stringify(s));
                              } catch (err) {
                                console.warn('Failed to persist video deletion', err);
                              }
                            }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-videos">No videos uploaded yet. Add one to get started!</div>
                )}
              </div>
              
              <button 
                className="edit-btn" 
                style={{ background: `linear-gradient(135deg, ${profileButtonColor}, ${profileButtonColor}dd)` }}
                onClick={() => {
                setTempBgImage(profileBgImage);
                setTempTextColor(profileTextColor);
                setTempFontUrl(profileFontUrl);
                setTempBorderColor(profileBorderColor);
                setTempButtonColor(profileButtonColor);
                setTempDisplayPic(profileDisplayPic);
                setTempTheme(profileTheme);
                setTempLayout(profileLayout);
                setIsEditingProfile(true);
              }}>Edit Profile</button>
            </div>
          </div>
        )}

        {isEditingProfile && (
          <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Profile</h2>
              <div className="modal-content">
                <div className="form-group">
                  <label htmlFor="theme">Theme:</label>
                  <select
                    id="theme"
                    value={tempTheme}
                    onChange={(e) => setTempTheme(e.target.value)}
                    className="modal-select"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="neon">Neon</option>
                    <option value="ocean">Ocean</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="layout">Layout:</label>
                  <select
                    id="layout"
                    value={tempLayout}
                    onChange={(e) => setTempLayout(e.target.value)}
                    className="modal-select"
                  >
                    <option value="classic">Classic</option>
                    <option value="grid">Grid</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="displayPic">Display Picture URL:</label>
                  <input
                    id="displayPic"
                    type="text"
                    value={tempDisplayPic}
                    onChange={(e) => setTempDisplayPic(e.target.value)}
                    placeholder="Enter profile picture URL"
                    className="modal-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="picUpload">Or Upload Picture:</label>
                  <input
                    id="picUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTempDisplayPic(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="file-input"
                  />
                </div>

                {tempDisplayPic && (
                  <div className="pic-preview">
                    <img src={tempDisplayPic} alt="Preview" />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="bgImage">Wallpaper URL:</label>
                  <input
                    id="bgImage"
                    type="text"
                    value={tempBgImage}
                    onChange={(e) => setTempBgImage(e.target.value)}
                    placeholder="Enter wallpaper image URL"
                    className="modal-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="textColor">Text Color:</label>
                  <div className="color-input-group">
                    <input
                      id="textColor"
                      type="color"
                      value={tempTextColor}
                      onChange={(e) => setTempTextColor(e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={tempTextColor}
                      onChange={(e) => setTempTextColor(e.target.value)}
                      placeholder="#ffffff"
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="borderColor">Border Color:</label>
                  <div className="color-input-group">
                    <input
                      id="borderColor"
                      type="color"
                      value={tempBorderColor}
                      onChange={(e) => setTempBorderColor(e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={tempBorderColor}
                      onChange={(e) => setTempBorderColor(e.target.value)}
                      placeholder="#00ffcc"
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="buttonColor">Button Color:</label>
                  <div className="color-input-group">
                    <input
                      id="buttonColor"
                      type="color"
                      value={tempButtonColor}
                      onChange={(e) => setTempButtonColor(e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={tempButtonColor}
                      onChange={(e) => setTempButtonColor(e.target.value)}
                      placeholder="#00ffcc"
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="fontUrl">Font URL (Google Fonts or CDN):</label>
                  <input
                    id="fontUrl"
                    type="text"
                    value={tempFontUrl}
                    onChange={(e) => setTempFontUrl(e.target.value)}
                    placeholder="Enter font URL or font name"
                    className="modal-input"
                  />
                </div>

                <div className="modal-buttons">
                  <button 
                    className="save-btn"
                    onClick={() => {
                      setProfileBgImage(tempBgImage);
                      setProfileTextColor(tempTextColor);
                      setProfileFontUrl(tempFontUrl);
                      setProfileBorderColor(tempBorderColor);
                      setProfileButtonColor(tempButtonColor);
                      setProfileDisplayPic(tempDisplayPic);
                      setProfileTheme(tempTheme);
                      setIsEditingProfile(false);
                    }}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;