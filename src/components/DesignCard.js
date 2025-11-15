function DesignCard({ design }) {
  return (
    <div className="card">
      <img src={design.thumbnail} alt={design.title} />
      <h3>{design.title}</h3>
      <a href={design.file} download>
        <button>Download</button>
      </a>
    </div>
  );
}
export default DesignCard;