import { useState, useEffect } from 'react';

function AddSpotModal({ isOpen, onClose, onSave, initialCoords }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState([]);
  const [coords, setCoords] = useState(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (initialCoords) {
      setCoords(initialCoords);
      setAddress(`${initialCoords.lat.toFixed(5)}, ${initialCoords.lng.toFixed(5)}`);
    } else {
      setCoords(null);
      setAddress('');
    }
  }, [initialCoords]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
    const results = await Promise.all(promises);
    setImages(results);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newPin = {
      name: name || "Untitled Spot",
      address: address,
      description: desc,
      lat: coords ? coords.lat : 0,
      lng: coords ? coords.lng : 0,
      images: images,
      rating: rating, // add rating 
      createdAt: new Date().toISOString()
    };

    onSave(newPin);
    
    // include rating
    setName('');
    setAddress('');
    setDesc('');
    setImages([]);
    setRating(0);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '450px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <strong>Add Spot</strong>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
          
          <label style={{ fontSize: '12px', color: '#666' }}>
            Place name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            placeholder="e.g. Joe's Coffee"
          />

          <label style={{ fontSize: '12px', color: '#666' }}>
            Address / Location
          </label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            required
          />

          {/* star rating input */}
          <label style={{ fontSize: '12px', color: '#666' }}>
            Rating
          </label>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star}
                onClick={() => setRating(star)}
                style={{
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: star <= rating ? '#FFD700' : '#ccc',
                  transition: 'color 0.2s ease'
                }}
              >
                ★
              </span>
            ))}
            {rating > 0 && (
              <span style={{
                fontSize: '12px',
                color: '#666',
                marginLeft: '5px'
              }}>
                ({rating}/5)
              </span>
            )}
          </div>

          <label style={{ fontSize: '12px', color: '#666' }}>
            Description
          </label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows="2"
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />

          <label style={{ fontSize: '12px', color: '#666' }}>
            Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
          
          <div style={{
            display: 'flex',
            gap: '5px',
            flexWrap: 'wrap'
          }}>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                style={{
                  width: '50px',
                  height: '50px',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }}
                alt="preview"
              />
            ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '10px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 12px',
                border: '1px solid #ccc',
                background: '#f3f4f6',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 12px',
                border: 'none',
                background: '#111827',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Add Spot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSpotModal;