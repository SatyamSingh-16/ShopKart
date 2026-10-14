export default function SearchBar({ search, onSearch, category, categories, onCategory, sort, onSort }) {
  return (
    <div className="filters">
      <div className="search-wrap"><label className="sr-only" htmlFor="product-search">Search products</label><span aria-hidden="true">⌕</span><input id="product-search" type="search" placeholder="Search products..." value={search} onChange={(event) => onSearch(event.target.value)} /></div>
      <div className="filter-field"><label className="sr-only" htmlFor="product-category">Category</label><select id="product-category" value={category} onChange={(event) => onCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="filter-field"><label className="sr-only" htmlFor="product-sort">Sort products</label><select id="product-sort" value={sort} onChange={(event) => onSort(event.target.value)}><option value="">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></div>
    </div>
  );
}
