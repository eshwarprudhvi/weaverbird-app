import React, { useState } from "react";
import { ArrowLeft, Plus, Search, Briefcase, Edit2, Trash2 } from "lucide-react";

const MaterialsCatalog = ({
  setIsCatalogScreenOpen,
  materialCatalog,
  handleAddCatalogItem,
  setEditItemModal,
  handleDeleteCatalogItem
}) => {
  const [newCatalogName, setNewCatalogName] = useState("");
  const [newCatalogPrice, setNewCatalogPrice] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  return (
    <>
      <div className="app-header fade-in">
        <div className="header-left">
          <button
            className="icon-btn"
            onClick={() => setIsCatalogScreenOpen(false)}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="header-title-container">
            <span className="header-subtitle">Reference Book</span>
            <h1 style={{ marginBottom: "2px" }}>Material Catalog</h1>
          </div>
        </div>
        <div className="header-right">
          <span className="catalog-count-badge" style={{ fontSize: "12px", padding: "4px 10px" }}>
            {materialCatalog.length} Items
          </span>
        </div>
      </div>

      <div className="screen-content fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Quick Add Section */}
        <div className="catalog-card" style={{ borderLeft: "4px solid var(--accent-gold)", flexShrink: 0 }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--text-title)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={15} style={{ color: "var(--accent-gold)" }} />
            Add Price Reference
          </h3>
          <form onSubmit={(e) => {
            handleAddCatalogItem(e, newCatalogName, newCatalogPrice);
            setNewCatalogName("");
            setNewCatalogPrice("");
          }} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              type="text"
              className="catalog-input"
              placeholder="Material Name (e.g. Granite slab)"
              value={newCatalogName}
              onChange={(e) => setNewCatalogName(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "10px" }}
              required
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="catalog-input"
                placeholder="Price Tag (e.g. ₹ 3,500 / bag)"
                value={newCatalogPrice}
                onChange={(e) => setNewCatalogPrice(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "10px", flex: 1 }}
                required
              />
              <button type="submit" className="catalog-add-btn" style={{ padding: "8px 16px", borderRadius: "10px", height: "36px", flexShrink: 0 }}>
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search and List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="catalog-search-wrapper" style={{ flexShrink: 0 }}>
            <Search className="catalog-search-icon" size={15} />
            <input
              type="text"
              className="catalog-search-input"
              placeholder="Search reference list..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              style={{ padding: "10px 12px 10px 36px", fontSize: "14px" }}
            />
          </div>

          <div className="catalog-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {materialCatalog.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                <Briefcase size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                <p style={{ fontSize: "14px" }}>No price references added yet.</p>
              </div>
            ) : (
              materialCatalog
                .filter((item) =>
                  item.name
                    .toLowerCase()
                    .includes(catalogSearch.toLowerCase())
                )
                .map((item) => (
                  <div key={item.id} className="catalog-item-row" style={{ padding: "12px 14px" }}>
                    <div className="catalog-item-info">
                      <span className="catalog-item-name" style={{ fontSize: "14px", fontWeight: "600" }}>{item.name}</span>
                      <span className="catalog-item-price-tag" style={{ fontSize: "12px", marginTop: "2px" }}>
                        {item.price}
                      </span>
                    </div>
                    <div className="catalog-item-actions">
                      <button
                        type="button"
                        className="catalog-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditItemModal({
                            type: "catalog_material",
                            itemId: item.id,
                            name: item.name,
                            price: item.price,
                          });
                        }}
                        title="Edit reference"
                        style={{ padding: "6px" }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="catalog-action-btn delete"
                        onClick={(e) => handleDeleteCatalogItem(e, item.id)}
                        title="Delete reference"
                        style={{ padding: "6px" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MaterialsCatalog;
