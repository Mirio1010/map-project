import '../style.css';

function Header() {
  return (
    <header className="site-header">
      <nav aria-label="Primary">
        <a className="brand" href="#" style={{ display:'flex', alignItems:'center', gap:'10px' }}>
           Spoty <span style={{ fontSize: '18px' }}>🗺️</span>
        </a>
        <ul className="tabs" role="tablist">
          <li role="presentation">
            <button role="tab" aria-selected="true">Home</button>
          </li>
          <li role="presentation">
            <button role="tab" aria-selected="false">Explore</button>
          </li>
          <li role="presentation">
            <button role="tab" aria-selected="false">Profile</button>
          </li>
          <li role="presentation">
            <button role="tab" aria-selected="false">About</button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;