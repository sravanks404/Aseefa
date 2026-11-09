import React, { useEffect, useRef, useState } from "react";

const MEDIA_SECTIONS = [
  {
    key: "interiorPhotos",
    title: "Interior Photos",
    subtitle: "Photos showing the interior of the property",
    icon: "bi-house-door",
  },
  {
    key: "exteriorPhotos",
    title: "Exterior Photos",
    subtitle: "Building exterior, entrance and surroundings",
    icon: "bi-building",
  },
  {
    key: "roomPhotos",
    title: "Room-wise Photos",
    subtitle: "Photos organized by individual rooms",
    icon: "bi-door-open",
  },
  {
    key: "kitchenPhotos",
    title: "Kitchen Photos",
    subtitle: "Kitchen layout, fittings and appliances",
    icon: "bi-cup-hot",
  },
  {
    key: "bathroomPhotos",
    title: "Bathroom Photos",
    subtitle: "Bathroom fittings and interiors",
    icon: "bi-droplet",
  },
  {
    key: "balconyPhotos",
    title: "Balcony Photos",
    subtitle: "Balcony, terrace and outdoor spaces",
    icon: "bi-border",
  },
  {
    key: "parkingPhotos",
    title: "Parking Photos",
    subtitle: "Parking area and vehicle spaces",
    icon: "bi-p-square",
  },
  {
    key: "amenitiesPhotos",
    title: "Amenities Photos",
    subtitle: "Pool, gym, garden and other amenities",
    icon: "bi-stars",
  },
];

const INITIAL_MEDIA = {
  coverImage: null,
  interiorPhotos: [],
  exteriorPhotos: [],
  roomPhotos: [],
  kitchenPhotos: [],
  bathroomPhotos: [],
  balconyPhotos: [],
  parkingPhotos: [],
  amenitiesPhotos: [],
  videoTour: "",
  virtualTour: "",
  beforePhotos: [],
  afterPhotos: [],
};

const Media = ({ selectedProperty = null, properties = [], onSelectProperty }) => {
  const [media, setMedia] = useState(INITIAL_MEDIA);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    setShowList(true);
    setSaved(false);
  }, [selectedProperty?.id]);

  const coverInputRef = useRef(null);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  const handleSingleImage = (file, field) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const image = {
      id: `${field}-${Date.now()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    };

    setMedia((prev) => ({
      ...prev,
      [field]: image,
    }));

    setSaved(false);
  };

  const handleMultipleImages = (files, field) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (selectedFiles.length === 0) {
      alert("Please select image files.");
      return;
    }

    const newImages = selectedFiles.map((file, index) => ({
      id: `${field}-${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setMedia((prev) => ({
      ...prev,
      [field]: [...prev[field], ...newImages],
    }));

    setSaved(false);
  };

  const removeSingleImage = (field) => {
    const image = media[field];

    if (image?.url) {
      URL.revokeObjectURL(image.url);
    }

    setMedia((prev) => ({
      ...prev,
      [field]: null,
    }));

    setSaved(false);
  };

  const removeMultipleImage = (field, imageId) => {
    setMedia((prev) => {
      const image = prev[field].find((item) => item.id === imageId);

      if (image?.url) {
        URL.revokeObjectURL(image.url);
      }

      return {
        ...prev,
        [field]: prev[field].filter((item) => item.id !== imageId),
      };
    });

    setSaved(false);
  };

  const handleTextChange = (field) => (e) => {
    setMedia((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    setSaved(false);
  };

  const openDetails = () => setShowList(false);
  const backToList = () => setShowList(true);

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      /*
        Connect your API here.

        Example:

        const CompanyID = sessionStorage.getItem("CompanyID");

        const formData = new FormData();

        formData.append("CompanyID", CompanyID);

        if (media.coverImage?.file) {
          formData.append("coverImage", media.coverImage.file);
        }

        media.interiorPhotos.forEach((image) => {
          formData.append("interiorPhotos", image.file);
        });

        formData.append("videoTour", media.videoTour);
        formData.append("virtualTour", media.virtualTour);

        await api.post("/api/savePropertyMedia", formData);
      */

      await new Promise((resolve) => setTimeout(resolve, 700));

      setSaved(true);
    } catch (error) {
      console.error("Error saving media:", error);
      alert("Unable to save media.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Object.keys(media).forEach((key) => {
      const value = media[key];

      if (value?.url) {
        URL.revokeObjectURL(value.url);
      }

      if (Array.isArray(value)) {
        value.forEach((image) => {
          if (image?.url) {
            URL.revokeObjectURL(image.url);
          }
        });
      }
    });

    setMedia(INITIAL_MEDIA);
    setSaved(false);
  };

  return (
    <div className="media-root">
      <style>{`
        :root {
          --media-primary: #10299b;
          --media-primary-dark: #0b1c6e;
          --media-primary-mid: #4a5fc1;
          --media-primary-soft: #eef1fb;
          --media-primary-tint: #d6ddf5;

          --media-ink: #1a1f36;
          --media-muted: #6b7290;

          --media-green: #1a9e6c;
          --media-green-soft: #e6f7f0;

          --media-danger: #dc3545;
          --media-danger-soft: #fff0f1;

          --media-white: #ffffff;
          --media-bg: #f8f9fc;
        }

        .media-root {
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          color: var(--media-ink);
          width: 100%;
        }

        .media-root *,
        .media-root *::before,
        .media-root *::after {
          box-sizing: border-box;
        }

        .media-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .media-page-title {
          margin: 0;
          color: var(--media-primary-dark);
          font-size: 1.25rem;
          font-weight: 800;
        }

        .media-page-subtitle {
          margin: 5px 0 0;
          color: var(--media-muted);
          font-size: 0.8rem;
        }

        .media-section {
          margin-bottom: 28px;
        }

        .media-section-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--media-primary-tint);
        }

        .media-section-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: var(--media-primary-soft);
          color: var(--media-primary);
          font-size: 0.95rem;
        }

        .media-section-title {
          margin: 0;
          color: var(--media-primary-dark);
          font-size: 0.95rem;
          font-weight: 700;
        }

        .media-section-sub {
          margin-top: 2px;
          color: var(--media-muted);
          font-size: 0.76rem;
        }

        .media-upload-box {
          position: relative;
          min-height: 145px;
          border: 1.5px dashed var(--media-primary-tint);
          border-radius: 11px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .media-upload-box:hover {
          border-color: var(--media-primary);
          background: var(--media-primary-soft);
        }

        .media-context-card{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; margin-bottom:16px; border:1px solid var(--media-primary-tint); border-radius:14px; background:var(--media-primary-soft); }
        .media-context-title{ font-size:.78rem; font-weight:700; color:var(--media-primary-dark); text-transform:uppercase; letter-spacing:.5px; }
        .media-context-sub{ font-size:.84rem; color:var(--media-muted); margin-top:3px; }
        .media-property-item{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #f0f2fa; cursor:pointer; }
        .media-property-item:last-child{ border-bottom:none; }
        .media-property-name{ font-size:.84rem; font-weight:700; color:var(--media-primary-dark); }
        .media-property-code{ font-size:.74rem; color:var(--media-muted); margin-top:3px; }

        .media-upload-icon {
          width: 42px;
          height: 42px;
          margin: 0 auto 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--media-primary-soft);
          color: var(--media-primary);
          font-size: 1.1rem;
        }

        .media-upload-title {
          margin: 0;
          color: var(--media-primary-dark);
          font-size: 0.84rem;
          font-weight: 700;
        }

        .media-upload-sub {
          margin: 4px 0 0;
          color: var(--media-muted);
          font-size: 0.72rem;
        }

        .media-hidden-input {
          display: none;
        }

        .media-preview-single {
          position: relative;
          width: 100%;
          min-height: 220px;
          overflow: hidden;
          border-radius: 11px;
          background: #f2f3f7;
        }

        .media-preview-single img {
          display: block;
          width: 100%;
          height: 220px;
          object-fit: cover;
        }

        .media-preview-overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 30px 12px 12px;
          background: linear-gradient(
            transparent,
            rgba(0, 0, 0, 0.72)
          );
          color: #fff;
        }

        .media-preview-name {
          max-width: 75%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.74rem;
        }

        .media-remove-btn {
          position: absolute;
          top: 9px;
          right: 9px;
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.95);
          color: var(--media-danger);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          z-index: 2;
        }

        .media-cover-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 5px 9px;
          border-radius: 20px;
          background: var(--media-primary);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
          z-index: 2;
        }
.media-photo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
}

.media-photo-item {
    position: relative;
    width: 150px;
    height: 110px;
    flex: 0 0 150px;
    overflow: hidden;
    border-radius: 9px;
    background: #f2f3f7;
}

.media-photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.media-photo-add {
    width: 150px;
    height: 110px;
    min-height: 110px;
    flex: 0 0 150px;

    border: 1.5px dashed var(--media-primary-tint);
    border-radius: 9px;
    background: #fff;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    color: var(--media-primary);
    cursor: pointer;
    transition: all 0.15s ease;
}

.media-photo-add:hover {
    border-color: var(--media-primary);
    background: var(--media-primary-soft);
}

        .media-photo-add i {
          font-size: 1.1rem;
          margin-bottom: 5px;
        }

        .media-photo-add span {
          font-size: 0.7rem;
          font-weight: 700;
        }

        .media-photo-count {
          margin-top: 9px;
          color: var(--media-muted);
          font-size: 0.72rem;
        }

        .media-field {
          margin-bottom: 0;
        }

        .media-label {
          display: block;
          margin-bottom: 6px;
          color: var(--media-primary-mid);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .media-input {
          width: 100%;
          min-height: 40px;
          border: 1px solid var(--media-primary-tint);
          border-radius: 9px;
          padding: 9px 12px;
          outline: none;
          background: #fff;
          color: var(--media-ink);
          font-size: 0.84rem;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .media-input:focus {
          border-color: var(--media-primary);
          box-shadow: 0 0 0 3px rgba(16, 41, 155, 0.12);
        }

        .media-input::placeholder {
          color: #a0a5b8;
        }

        .media-url-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .media-url-help {
          margin-top: 6px;
          color: var(--media-muted);
          font-size: 0.7rem;
        }

        .media-before-after {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .media-ba-column {
          min-width: 0;
        }

        .media-ba-title {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
          color: var(--media-primary-dark);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .media-ba-title i {
          color: var(--media-primary);
        }

        .media-footer {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 18px;
          border-top: 1px solid var(--media-primary-tint);
        }

        .media-btn {
          min-height: 40px;
          border: none;
          border-radius: 10px;
          padding: 9px 20px;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .media-btn-primary {
          background: var(--media-primary);
          color: #fff;
        }

        .media-btn-primary:hover:not(:disabled) {
          background: var(--media-primary-dark);
          box-shadow: 0 4px 10px rgba(16, 41, 155, 0.25);
        }

        .media-btn-secondary {
          background: var(--media-primary-soft);
          color: var(--media-primary);
        }

        .media-btn-secondary:hover:not(:disabled) {
          background: var(--media-primary-tint);
        }

        .media-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .media-saved {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 9px;
          background: var(--media-green-soft);
          color: var(--media-green);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .media-empty {
          padding: 14px;
          border: 1px dashed var(--media-primary-tint);
          border-radius: 9px;
          color: var(--media-muted);
          background: #fff;
          text-align: center;
          font-size: 0.74rem;
        }

        @media (max-width: 768px) {
          .media-page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .media-url-grid,
          .media-before-after {
            grid-template-columns: 1fr;
          }

          .media-photo-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .media-photo-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .media-photo-item,
          .media-photo-add {
            height: 110px;
            min-height: 110px;
          }

          .media-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .media-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="media-context-card">
        <div>
          <div className="media-context-title">Selected property</div>
          <div className="media-context-sub">
            {selectedProperty
              ? selectedProperty.propertyName || selectedProperty.propertyCode || "Selected property"
              : "Choose a property from the list to continue"}
          </div>
        </div>

        {selectedProperty ? (
          <button
            type="button"
            className="media-btn media-btn-secondary"
            onClick={() => onSelectProperty?.(null)}
          >
            Change property
          </button>
        ) : null}
      </div>

      {!selectedProperty ? (
        <div className="media-context-card" style={{ display: "block", padding: 0, background: "#fff" }}>
          {properties.map((property) => (
            <div
              key={property.id}
              className="media-property-item"
              onClick={() => onSelectProperty?.(property.id)}
            >
              <div>
                <div className="media-property-name">
                  {property.propertyName || property.propertyCode}
                </div>
                <div className="media-property-code">
                  {property.propertyCode || property.propertyId}
                </div>
              </div>
              <i className="bi bi-chevron-right" style={{ color: "var(--media-primary)" }}></i>
            </div>
          ))}
        </div>
      ) : !showList ? (
        <form onSubmit={handleSave}>
        {/* PAGE HEADER */}
        <div className="media-page-header">
          <div>
            <h2 className="media-page-title">Media</h2>
            <p className="media-page-subtitle">
              Manage property photos, videos and virtual tours
            </p>
          </div>
        </div>

        {/* COVER IMAGE */}
        <div className="media-section">
          <div className="media-section-head">
            <div className="media-section-icon">
              <i className="bi bi-image"></i>
            </div>

            <div>
              <p className="media-section-title">Cover Image</p>
              <div className="media-section-sub">
                Main image displayed for this property
              </div>
            </div>
          </div>

          {!media.coverImage ? (
            <div
              className="media-upload-box"
              onClick={() => coverInputRef.current?.click()}
            >
              <div>
                <div className="media-upload-icon">
                  <i className="bi bi-cloud-arrow-up"></i>
                </div>

                <p className="media-upload-title">
                  Upload Cover Image
                </p>

                <p className="media-upload-sub">
                  JPG, JPEG or PNG · Recommended 1200 × 800
                </p>
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="media-hidden-input"
                onChange={(e) =>
                  handleSingleImage(e.target.files?.[0], "coverImage")
                }
              />
            </div>
          ) : (
            <div className="media-preview-single">
              <span className="media-cover-badge">
                <i className="bi bi-star-fill me-1"></i>
                Cover Image
              </span>

              <button
                type="button"
                className="media-remove-btn"
                onClick={() => removeSingleImage("coverImage")}
              >
                <i className="bi bi-x-lg"></i>
              </button>

              <img
                src={media.coverImage.url}
                alt={media.coverImage.name}
              />

              <div className="media-preview-overlay">
                <div className="media-preview-name">
                  {media.coverImage.name}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PHOTO SECTIONS */}
        {MEDIA_SECTIONS.map((section) => {
          const photos = media[section.key];

          return (
            <div className="media-section" key={section.key}>
              <div className="media-section-head">
                <div className="media-section-icon">
                  <i className={`bi ${section.icon}`}></i>
                </div>

                <div>
                  <p className="media-section-title">
                    {section.title}
                  </p>

                  <div className="media-section-sub">
                    {section.subtitle}
                  </div>
                </div>
              </div>

              <div className="media-photo-grid">
                {photos.map((image) => (
                  <div className="media-photo-item" key={image.id}>
                    <button
                      type="button"
                      className="media-remove-btn"
                      onClick={() =>
                        removeMultipleImage(section.key, image.id)
                      }
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>

                    <img
                      src={image.url}
                      alt={image.name}
                    />
                  </div>
                ))}

                <div
                  className="media-photo-add"
                  onClick={() =>
                    document
                      .getElementById(`media-${section.key}`)
                      ?.click()
                  }
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Add Photos</span>

                  <input
                    id={`media-${section.key}`}
                    type="file"
                    accept="image/*"
                    multiple
                    className="media-hidden-input"
                    onChange={(e) =>
                      handleMultipleImages(
                        e.target.files,
                        section.key
                      )
                    }
                  />
                </div>
              </div>

              <div className="media-photo-count">
                <i className="bi bi-images me-1"></i>
                {photos.length} photo
                {photos.length !== 1 ? "s" : ""} selected
              </div>
            </div>
          );
        })}

        {/* VIDEO / VIRTUAL TOUR */}
        <div className="media-section">
          <div className="media-section-head">
            <div className="media-section-icon">
              <i className="bi bi-camera-video"></i>
            </div>

            <div>
              <p className="media-section-title">
                Video & Virtual Tour
              </p>

              <div className="media-section-sub">
                Add video tour and interactive virtual tour links
              </div>
            </div>
          </div>

          <div className="media-url-grid">
            <div className="media-field">
              <label className="media-label">
                Video Tour
              </label>

              <input
                type="url"
                className="media-input"
                value={media.videoTour}
                onChange={handleTextChange("videoTour")}
                placeholder="https://youtube.com/watch?v=..."
              />

              <div className="media-url-help">
                YouTube, Vimeo or other supported video URL
              </div>
            </div>

            <div className="media-field">
              <label className="media-label">
                Virtual Tour
              </label>

              <input
                type="url"
                className="media-input"
                value={media.virtualTour}
                onChange={handleTextChange("virtualTour")}
                placeholder="https://example.com/virtual-tour"
              />

              <div className="media-url-help">
                Enter the URL of your 360° or virtual tour
              </div>
            </div>
          </div>
        </div>

        {/* BEFORE / AFTER */}
        <div className="media-section">
          <div className="media-section-head">
            <div className="media-section-icon">
              <i className="bi bi-arrow-left-right"></i>
            </div>

            <div>
              <p className="media-section-title">
                Before / After Renovation Photos
              </p>

              <div className="media-section-sub">
                Compare property condition before and after renovation
              </div>
            </div>
          </div>

          <div className="media-before-after">
            {/* BEFORE */}
            <div className="media-ba-column">
              <div className="media-ba-title">
                <i className="bi bi-clock-history"></i>
                Before Renovation
              </div>

              <div className="media-photo-grid">
                {media.beforePhotos.map((image) => (
                  <div className="media-photo-item" key={image.id}>
                    <button
                      type="button"
                      className="media-remove-btn"
                      onClick={() =>
                        removeMultipleImage(
                          "beforePhotos",
                          image.id
                        )
                      }
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>

                    <img
                      src={image.url}
                      alt={image.name}
                    />
                  </div>
                ))}

                <div
                  className="media-photo-add"
                  onClick={() =>
                    beforeInputRef.current?.click()
                  }
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Add Before Photos</span>

                  <input
                    ref={beforeInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="media-hidden-input"
                    onChange={(e) =>
                      handleMultipleImages(
                        e.target.files,
                        "beforePhotos"
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* AFTER */}
            <div className="media-ba-column">
              <div className="media-ba-title">
                <i className="bi bi-stars"></i>
                After Renovation
              </div>

              <div className="media-photo-grid">
                {media.afterPhotos.map((image) => (
                  <div className="media-photo-item" key={image.id}>
                    <button
                      type="button"
                      className="media-remove-btn"
                      onClick={() =>
                        removeMultipleImage(
                          "afterPhotos",
                          image.id
                        )
                      }
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>

                    <img
                      src={image.url}
                      alt={image.name}
                    />
                  </div>
                ))}

                <div
                  className="media-photo-add"
                  onClick={() =>
                    afterInputRef.current?.click()
                  }
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Add After Photos</span>

                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="media-hidden-input"
                    onChange={(e) =>
                      handleMultipleImages(
                        e.target.files,
                        "afterPhotos"
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="media-footer">
          <button
            type="submit"
            className="media-btn media-btn-primary"
            disabled={saving}
          >
            <i
              className={`bi ${
                saving
                  ? "bi-hourglass-split"
                  : "bi-check2-circle"
              } me-2`}
            ></i>

            {saving ? "Saving…" : "Save Media"}
          </button>

          <button
            type="button"
            className="media-btn media-btn-secondary"
            onClick={handleReset}
            disabled={saving}
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>
            Reset
          </button>

          {saved && (
            <span className="media-saved">
              <i className="bi bi-check-circle-fill"></i>
              Media saved successfully
            </span>
          )}
        </div>
        </form>
      ) : (
        <>
          <div className="media-context-card" style={{ marginBottom: 18 }}>
            <div>
              <div className="media-context-title">Media collection</div>
              <div className="media-context-sub">
                Open the media workspace to manage cover images, gallery photos, and tour links.
              </div>
            </div>
          </div>

          <div className="media-footer" style={{ marginTop: 16 }}>
            <button type="button" className="media-btn media-btn-primary" onClick={openDetails}>
              <i className="bi bi-images me-2"></i>
              Open media workspace
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Media;