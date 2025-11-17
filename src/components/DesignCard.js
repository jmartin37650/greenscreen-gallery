function DesignCard({ design }) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(design['hover-image']);
  };

  return (
    <div className="card">
      {/* Thumbnail with hover preview */}
      <div className="thumbnail-wrapper">
        <img
          src={design.thumbnail}
          alt={design.title}
          className="thumbnail"
        />
        <div className="hover-preview">
          <img
            src={design['hover-image']}
            alt={design.title}
            className="preview-image"
          />
        </div>
      </div>

      {/* Title and download */}
      <h3>{design.title}</h3>
      <a href={design.file} download>
        <button>Download</button>
      </a>

      {/* Image link text box */}
      <div className="image-link-container">
        <input
          type="text"
          value={design['hover-image']}
          readOnly
          className="image-link-input"
          placeholder="Image link"
        />
        <button className="copy-btn" onClick={handleCopyLink} title="Copy link">
          Copy
        </button>
      </div>
    </div>
  );
}

export default DesignCard;