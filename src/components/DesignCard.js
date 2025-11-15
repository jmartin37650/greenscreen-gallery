function DesignCard({ design }) {
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
    </div>
  );
}

export default DesignCard;